'use client';

import React, { useState, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import {
  getPersistenceAdapter,
  type AeroloomExportBundle,
  type StoredFlight,
  type StoredWatchlist,
} from '@/lib/storage/persistenceAdapter';

export interface ImportWatchlistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDataChanged?: () => void;
}

import { validateBundle } from '@/lib/storage/bundleValidator';
export { validateBundle };

export function ImportWatchlistDialog({
  isOpen,
  onClose,
  onDataChanged,
}: ImportWatchlistDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parsedBundle, setParsedBundle] = useState<AeroloomExportBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    try {
      setIsProcessing(true);
      const adapter = getPersistenceAdapter();
      const bundle = await adapter.exportData();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aeroloom-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMsg('Watchlist & telemetry backup exported successfully.');
    } catch {
      setError('Failed to generate export file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const val = validateBundle(json);
        if (!val.valid || !val.bundle) {
          setError(val.error || 'Invalid bundle structure.');
          setParsedBundle(null);
        } else {
          setParsedBundle(val.bundle);
        }
      } catch {
        setError('Syntax error parsing JSON file. Please ensure it is a valid Aeroloom export.');
        setParsedBundle(null);
      }
    };
    reader.readAsText(file);
  };

  const handleApplyImport = async () => {
    if (!parsedBundle) return;
    try {
      setIsProcessing(true);
      const adapter = getPersistenceAdapter();

      if (importMode === 'replace') {
        await adapter.importData(parsedBundle);
      } else {
        // Merge mode: retain existing watchlists and append non-duplicate entries
        const existing = await adapter.exportData();
        const existingWlMap = new Map<string, StoredWatchlist>(existing.watchlists.map((w: StoredWatchlist) => [w.name.toLowerCase(), w]));
        
        parsedBundle.watchlists.forEach((newWl: StoredWatchlist) => {
          const match = existingWlMap.get(newWl.name.toLowerCase());
          if (match) {
            // Merge unique aircraft hexes
            const mergedHexes = Array.from(new Set([...match.aircraftHexes, ...newWl.aircraftHexes]));
            match.aircraftHexes = mergedHexes;
          } else {
            existing.watchlists.push(newWl);
          }
        });

        // Merge saved flights
        const flightHexSet = new Set(existing.savedFlights.map((f: StoredFlight) => f.id.toLowerCase()));
        parsedBundle.savedFlights.forEach((f: StoredFlight) => {
          if (!flightHexSet.has(f.id.toLowerCase())) {
            existing.savedFlights.push(f);
            flightHexSet.add(f.id.toLowerCase());
          }
        });

        await adapter.importData(existing);
      }

      setSuccessMsg(`Import successful: ${parsedBundle.watchlists.length} watchlists processed.`);
      setParsedBundle(null);
      if (onDataChanged) onDataChanged();
    } catch {
      setError('An error occurred applying imported telemetry.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--ink)]/40 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-md)] max-w-lg w-full p-6 shadow-xl space-y-6 text-[var(--ink)] font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[var(--paper-2)] border border-[var(--line)] flex items-center justify-center text-[var(--ink)]">
              <Icon name="upload" size={16} />
            </div>
            <div>
              <h2 id="import-dialog-title" className="font-serif text-lg font-bold">
                Watchlist &amp; Data Sync
              </h2>
              <span className="mono-label text-[10px] text-[var(--ink-3)]">
                OFFLINE JSON BUNDLE TRANSFER
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--paper-2)] text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="p-3 bg-[var(--paper-2)] border border-[var(--bad-ink)]/30 text-[var(--bad-ink)] text-xs font-mono rounded flex items-center gap-2">
            <Icon name="alert-triangle" className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-[var(--paper-2)] border border-[var(--good-ink)]/30 text-[var(--good-ink)] text-xs font-mono rounded flex items-center gap-2">
            <Icon name="check-circle" className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Export Section */}
        <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--r-sm)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-[var(--ink)]">BACKUP CURRENT WATCHLISTS</span>
            <Chip variant="neutral">JSON v1.0</Chip>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Export all saved airframes, watchlists, and alert configurations to a portable JSON backup file.
          </p>
          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              icon="download"
              onClick={handleExport}
              disabled={isProcessing}
            >
              Export JSON Bundle
            </Button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-4">
          <span className="font-mono text-xs font-bold text-[var(--ink)] block">
            RESTORE FROM BACKUP
          </span>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!parsedBundle ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[var(--line-strong)] hover:border-[var(--signal)] bg-[var(--paper)] rounded-[var(--r-sm)] p-6 text-center cursor-pointer transition-colors space-y-2"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--paper-2)] flex items-center justify-center mx-auto text-[var(--ink-3)]">
                <Icon name="upload" size={18} />
              </div>
              <div className="text-xs font-mono font-semibold text-[var(--ink)]">
                Click or drop JSON file here to verify
              </div>
              <p className="text-[11px] text-[var(--ink-3)]">
                Supports Aeroloom schema v1.0 files
              </p>
            </div>
          ) : (
            <div className="bg-[var(--paper-2)] border border-[var(--line)] rounded-[var(--r-sm)] p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--ink)]">BUNDLE VERIFIED</span>
                <Chip variant="ok">VALID SCHEMA</Chip>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--ink-2)] pt-1">
                <div>Watchlists: <span className="font-bold text-[var(--ink)]">{parsedBundle.watchlists.length}</span></div>
                <div>Saved Flights: <span className="font-bold text-[var(--ink)]">{parsedBundle.savedFlights.length}</span></div>
              </div>

              {/* Mode Select */}
              <div className="pt-2 border-t border-[var(--line)] flex items-center justify-between gap-4">
                <span className="text-[11px] text-[var(--ink-3)]">Strategy:</span>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="accent-[var(--signal)]"
                    />
                    <span className="text-xs">Merge</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-[var(--signal)]"
                    />
                    <span className="text-xs">Overwrite</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setParsedBundle(null)}>
                  Cancel
                </Button>
                <Button variant="ink" size="sm" icon="check" onClick={handleApplyImport} disabled={isProcessing}>
                  Apply Restore
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-[var(--line)] pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
