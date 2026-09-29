'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plane,
  Star,
  ShieldAlert,
  Bell,
  Trash2,
  Plus,
  Crosshair,
  ExternalLink,
  Layers,
  Activity,
  MapPin,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useUserStore } from '@/lib/storage/userStore';
import { AVIATION_SECTORS } from '@/lib/map/config';
import type { AircraftPosition } from '@/lib/providers/positions/types';

export default function DashboardPage() {
  const {
    savedFlights,
    watchlists,
    alerts,
    unreadAlertsCount,
    toggleSaveFlight,
    createWatchlist,
    removeWatchlist,
    toggleAircraftInWatchlist,
    markAlertRead,
    clearAllAlerts,
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<'saved' | 'watchlists' | 'alerts'>('saved');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [liveAircraft, setLiveAircraft] = useState<AircraftPosition[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);

  // Poll live traffic count for analytics summary
  useEffect(() => {
    let isCancelled = false;
    async function loadLiveTraffic() {
      try {
        const res = await fetch('/api/aircraft/live?radius=250');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.aircraft) && !isCancelled) {
            setLiveAircraft(json.aircraft);
          }
        }
      } catch {
        // ignore
      } finally {
        if (!isCancelled) setIsLoadingTraffic(false);
      }
    }
    loadLiveTraffic();
    const interval = setInterval(loadLiveTraffic, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleCreateWl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    createWatchlist(newWatchlistName.trim());
    setNewWatchlistName('');
  };

  // Sector intelligence analytics
  const totalObserved = liveAircraft.length;
  let stratoCount = 0;
  let cruiseCount = 0;
  let termCount = 0;
  let gndCount = 0;
  let emergencyCount = 0;

  for (const ac of liveAircraft) {
    if (ac.isGround) gndCount++;
    else if (ac.altitude >= 28000) stratoCount++;
    else if (ac.altitude >= 18000) cruiseCount++;
    else termCount++;

    if (ac.squawk === '7700' || ac.squawk === '7600' || ac.squawk === '7500') {
      emergencyCount++;
    }
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans selection:bg-sky-500/30">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 border-b border-[#1f293d]/80 bg-[#080d1a]/85 backdrop-blur-xl px-4 py-3 sm:px-8 flex items-center justify-between font-mono">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>OBSERVATORY</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-white uppercase">AEROLOOM</span>
            <span className="text-slate-600 font-light">/</span>
            <span className="text-xs text-sky-400 font-semibold uppercase tracking-wider">
              OPERATIONS DASHBOARD
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <Link
            href="/airports"
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            AIRPORTS
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors shadow-lg shadow-sky-500/20"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>TACTICAL RADAR</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-8 font-mono">
        {/* Airspace Analytics Summary Banner (Phase F) */}
        <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1f293d] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f293d]/80">
            <div>
              <span className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold block">
                INTELLIGENCE OVERVIEW &bull; CONUS AIRSPACE
              </span>
              <h1 className="text-2xl font-bold text-white tracking-wide mt-0.5">
                REAL-TIME AIRSPACE OPERATIONS
              </h1>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-300 font-semibold">FEED ONLINE</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400">
                {isLoadingTraffic ? 'SCANNING...' : `${totalObserved} AIRCRAFT TRACKED`}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <span className="text-[9px] text-slate-500 uppercase block">STRATOSPHERE (&ge;28K)</span>
              <span className="text-lg font-bold text-indigo-300 mt-1 block">{stratoCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <span className="text-[9px] text-slate-500 uppercase block">CRUISE (18K-28K)</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">{cruiseCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <span className="text-[9px] text-slate-500 uppercase block">TERMINAL (&lt;18K)</span>
              <span className="text-lg font-bold text-sky-300 mt-1 block">{termCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <span className="text-[9px] text-slate-500 uppercase block">GROUND TAXI</span>
              <span className="text-lg font-bold text-slate-400 mt-1 block">{gndCount}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <span className="text-[9px] text-slate-500 uppercase block">EMERGENCY SQUAWKS</span>
              <span className={`text-lg font-bold mt-1 block ${emergencyCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                {emergencyCount} ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[#1f293d] pb-2 text-xs">
          <button
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'saved'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>SAVED FLIGHTS ({savedFlights.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('watchlists')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors ${
              activeTab === 'watchlists'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>WATCHLISTS ({watchlists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors relative ${
              activeTab === 'alerts'
                ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>AIRSPACE ALERTS</span>
            {unreadAlertsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 ml-1" />
            )}
          </button>
        </div>

        {/* TAB 1: SAVED FLIGHTS */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>AIRCRAFT PINNED FOR CONTINUOUS MONITORING</span>
              <span className="text-[10px] text-slate-500">SAVED IN SECURE BROWSER STORAGE</span>
            </div>

            {savedFlights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-4 rounded-xl bg-[#080d1a] border border-[#1f293d] flex flex-col justify-between gap-3 hover:border-sky-500/50 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-base tracking-wider group-hover:text-sky-300 transition-colors">
                          {flight.callsign || flight.id.toUpperCase()}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 border border-sky-800 text-sky-300 font-semibold">
                          HEX: {flight.id.toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <span>{flight.aircraftType || 'GENERIC TYPE'}</span>
                        {flight.registration && <span>&bull; {flight.registration}</span>}
                      </div>

                      <span className="text-[10px] text-slate-500 block mt-2">
                        SAVED: {new Date(flight.savedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]/60 text-xs">
                      <Link
                        href={`/flight/${flight.id}`}
                        className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
                      >
                        <span>DOSSIER</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/?select=${flight.id}&stage=observatory`}
                          className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 font-semibold text-[11px] flex items-center gap-1"
                        >
                          <Crosshair className="w-3 h-3" />
                          <span>TRACK</span>
                        </Link>

                        <button
                          onClick={() =>
                            toggleSaveFlight({
                              id: flight.id,
                              callsign: flight.callsign || flight.id,
                              latitude: 0,
                              longitude: 0,
                              altitude: 0,
                              speed: 0,
                              heading: 0,
                              timestamp: 0,
                              source: 'airplanes.live',
                            })
                          }
                          className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/50 transition-colors"
                          title="Remove from saved"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#080d1a] border border-[#1f293d] text-center space-y-3">
                <Star className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">NO SAVED FLIGHTS</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Click the star icon on any flight dossier or tactical radar marker to pin it for tracking.
                </p>
                <div className="pt-2">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-bold text-xs"
                  >
                    DISCOVER FLIGHTS IN OBSERVATORY
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WATCHLISTS */}
        {activeTab === 'watchlists' && (
          <div className="space-y-6">
            {/* Create Watchlist Form */}
            <form onSubmit={handleCreateWl} className="p-4 rounded-xl bg-[#080d1a] border border-[#1f293d] flex gap-3 text-xs">
              <input
                type="text"
                placeholder="New Watchlist Name (e.g. Pacific Cargo Hubs, Heavy Transports)..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-[#040711] border border-slate-800 text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>CREATE</span>
              </button>
            </form>

            {/* Watchlists Grid */}
            <div className="space-y-4">
              {watchlists.map((wl) => (
                <div
                  key={wl.id}
                  className="p-5 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-wide">{wl.name}</h3>
                      <span className="text-[10px] text-slate-500">
                        {wl.aircraftHexes.length} MONITORED TRANSPONDERS
                      </span>
                    </div>

                    <button
                      onClick={() => removeWatchlist(wl.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Delete Watchlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {wl.aircraftHexes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {wl.aircraftHexes.map((hex) => (
                        <div
                          key={hex}
                          className="px-2.5 py-1 rounded-lg bg-[#040711] border border-slate-800 flex items-center gap-2 text-xs"
                        >
                          <span className="font-bold text-sky-300">{hex.toUpperCase()}</span>
                          <Link
                            href={`/flight/${hex}`}
                            className="text-slate-400 hover:text-white"
                            title="Open Dossier"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                          <button
                            onClick={() => toggleAircraftInWatchlist(wl.id, hex)}
                            className="text-slate-500 hover:text-rose-400"
                            title="Remove from watchlist"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No aircraft in this watchlist yet. Add transponder hexes from the radar dossier.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AIRSPACE ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>REAL-TIME TRANSPONDER EVENT LOG</span>
              {alerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  CLEAR ALL ALERTS
                </button>
              )}
            </div>

            {alerts.length > 0 ? (
              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition-all ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                        : 'bg-[#080d1a] border-[#1f293d] text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold tracking-wider">{alert.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300">
                            {alert.aircraftId.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5 font-sans">
                          {alert.message}
                        </p>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/flight/${alert.aircraftId}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs flex items-center gap-1"
                      >
                        <span>DOSSIER</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 rounded-2xl bg-[#080d1a] border border-[#1f293d] text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-base font-bold text-white">ALL AIRSPACES NORMAL</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  No emergency squawks (7700 / 7600) or monitored transponder alerts triggered in current telemetry window.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
