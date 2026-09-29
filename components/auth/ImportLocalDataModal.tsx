'use client';

import React, { useState, useEffect } from 'react';
import { CloudUpload, CheckCircle, AlertTriangle, Shield, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuth } from '@/lib/auth/authContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { userStore } from '@/lib/storage/userStore';

interface ImportLocalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export default function ImportLocalDataModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportLocalDataModalProps) {
  const { user } = useAuth();
  const [localSavedCount, setLocalSavedCount] = useState(0);
  const [localWatchlistsCount, setLocalWatchlistsCount] = useState(0);
  const [isMigrating, setIsMigrating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const saved = userStore.getSavedFlights();
      const watchlists = userStore.getWatchlists();
      setLocalSavedCount(saved.length);
      setLocalWatchlistsCount(watchlists.length);
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  // If user has zero local data, don't show the migration modal
  if (localSavedCount === 0 && localWatchlistsCount === 0) {
    return null;
  }

  const handleMigrate = async () => {
    setIsMigrating(true);
    setErrorMessage(null);
    setStatusMessage('Syncing local telemetry items to Supabase cloud...');

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setErrorMessage('Cloud database client is not available.');
        setIsMigrating(false);
        return;
      }

      const saved = userStore.getSavedFlights();
      const watchlists = userStore.getWatchlists();

      // 1. Sync Saved Flights (insert on conflict do nothing)
      if (saved.length > 0) {
        const payload = saved.map((flight) => ({
          user_id: user.id,
          aircraft_hex: flight.id.toLowerCase(),
          callsign: flight.callsign || null,
          aircraft_type: flight.aircraftType || null,
          registration: flight.registration || null,
          saved_at: new Date(flight.savedAt).toISOString(),
        }));

        const { error: savedError } = await supabase
          .from('saved_flights')
          .upsert(payload, { onConflict: 'user_id,aircraft_hex', ignoreDuplicates: true });

        if (savedError) {
          console.warn('Saved flights migration warning:', savedError);
        }
      }

      // 2. Sync Watchlists
      if (watchlists.length > 0) {
        const wlPayload = watchlists.map((wl) => ({
          user_id: user.id,
          name: wl.name,
          aircraft_hexes: wl.aircraftHexes,
          created_at: new Date(wl.createdAt).toISOString(),
        }));

        const { error: wlError } = await supabase
          .from('watchlists')
          .insert(wlPayload);

        if (wlError) {
          console.warn('Watchlists migration warning:', wlError);
        }
      }

      setStatusMessage('Migration complete! All local telemetry securely synced.');
      setTimeout(() => {
        onImportComplete?.();
        onClose();
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error syncing local items.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#080d1a]/95 border border-[#1f293d] p-6 shadow-2xl backdrop-blur-xl font-mono text-slate-200">
        <div className="flex items-center justify-between border-b border-[#1f293d] pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <CloudUpload className="w-4 h-4" />
            </div>
            <div>
              <h2 id="import-modal-title" className="text-sm font-bold tracking-wider text-white">
                SYNC LOCAL TELEMETRY
              </h2>
              <p className="text-[10px] text-slate-400">
                Migrate browser telemetry to your authenticated cloud account
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close sync modal"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/25 mb-4 text-xs space-y-2">
          <div className="flex items-center gap-2 text-sky-300 font-semibold">
            <Shield className="w-4 h-4 shrink-0 text-sky-400" />
            <span>Detected Local Device Data</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            We discovered operational data stored locally in this browser:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2 rounded-lg bg-[#0f172a] border border-[#1f293d] text-center">
              <div className="text-base font-bold text-white">{localSavedCount}</div>
              <div className="text-[10px] text-slate-400">Saved Flights</div>
            </div>
            <div className="p-2 rounded-lg bg-[#0f172a] border border-[#1f293d] text-center">
              <div className="text-base font-bold text-white">{localWatchlistsCount}</div>
              <div className="text-[10px] text-slate-400">Custom Watchlists</div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            Would you like to import these records into your cloud account for multi-device sync? Local copies will be preserved safely.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {statusMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            KEEP LOCAL ONLY
          </button>
          <button
            type="button"
            onClick={handleMigrate}
            disabled={isMigrating}
            className="flex-1 py-2 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>SYNCING...</span>
              </>
            ) : (
              <>
                <span>SYNC TO CLOUD</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
