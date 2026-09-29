'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Download,
  Upload,
  Database,
  User,
  Shield,
  Cloud,
  LogOut,
  ToggleLeft,
  ToggleRight,
  Radio,
  Sliders,
} from 'lucide-react';
import { useUserStore } from '@/lib/storage/userStore';
import {
  persistenceAdapter,
  type AeroloomExportBundle,
  type StoredAlertRule,
} from '@/lib/storage/persistenceAdapter';
import { evaluateAirspaceRules } from '@/lib/alerts/alertEngine';
import { useAuth } from '@/lib/auth/authContext';
import AuthModal from '@/components/auth/AuthModal';
import ImportLocalDataModal from '@/components/auth/ImportLocalDataModal';
import type { AircraftPosition } from '@/lib/providers/positions/types';

export default function DashboardPage() {
  const { user, profile, signOut, isConfigured } = useAuth();

  const {
    savedFlights,
    watchlists,
    alerts,
    unreadAlertsCount,
    toggleSaveFlight,
    createWatchlist,
    removeWatchlist,
    toggleAircraftInWatchlist,
    addAlert,
    markAlertRead,
    clearAllAlerts,
  } = useUserStore();

  const [activeTab, setActiveTab] = useState<'saved' | 'watchlists' | 'alerts'>('saved');
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [liveAircraft, setLiveAircraft] = useState<AircraftPosition[]>([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);

  // Alert Rules State
  const [alertRules, setAlertRules] = useState<StoredAlertRule[]>([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // New Rule Form
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<StoredAlertRule['ruleType']>('EMERGENCY_SQUAWK');
  const [newRuleSquawk, setNewRuleSquawk] = useState('7700');
  const [newRuleAltitude, setNewRuleAltitude] = useState('40000');
  const [showAddRuleForm, setShowAddRuleForm] = useState(false);

  // Load configured alert rules
  const loadAlertRules = useCallback(async () => {
    if (persistenceAdapter.getAlertRules) {
      const rules = await persistenceAdapter.getAlertRules(user?.id);
      setAlertRules(rules);
    }
  }, [user]);

  useEffect(() => {
    loadAlertRules();
  }, [loadAlertRules]);

  // Poll live traffic count for analytics summary & live alert evaluation
  useEffect(() => {
    let isCancelled = false;
    async function loadLiveTraffic() {
      try {
        const res = await fetch('/api/aircraft/live?radius=250');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.aircraft) && !isCancelled) {
            setLiveAircraft(json.aircraft);

            // Real-time evaluation of live telemetry against configured rules
            if (alertRules.length > 0) {
              const triggered = evaluateAirspaceRules(json.aircraft, alertRules, watchlists);
              for (const tr of triggered) {
                addAlert({
                  type: tr.type,
                  severity: tr.severity,
                  title: tr.title,
                  message: tr.message,
                  aircraftId: tr.aircraftId,
                  callsign: tr.callsign,
                  squawk: tr.squawk,
                });
              }
            }
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
  }, [alertRules, watchlists, addAlert]);

  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleExportBackup = async () => {
    try {
      const bundle = await persistenceAdapter.exportData();
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aeroloom-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setImportStatus('Failed to generate export bundle.');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AeroloomExportBundle;
      const success = await persistenceAdapter.importData(parsed);
      if (success) {
        setImportStatus('Backup restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setImportStatus('Invalid or incompatible backup file.');
      }
    } catch {
      setImportStatus('Error reading JSON file.');
    }
  };

  const handleCreateWl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    createWatchlist(newWatchlistName.trim());
    setNewWatchlistName('');
  };

  // Toggle Alert Rule Status
  const handleToggleRule = async (rule: StoredAlertRule) => {
    const updated = { ...rule, enabled: !rule.enabled };
    if (persistenceAdapter.saveAlertRule) {
      await persistenceAdapter.saveAlertRule(updated, user?.id);
      await loadAlertRules();
    }
  };

  // Delete Alert Rule
  const handleDeleteRule = async (id: string) => {
    if (persistenceAdapter.deleteAlertRule) {
      await persistenceAdapter.deleteAlertRule(id, user?.id);
      await loadAlertRules();
    }
  };

  // Create New Alert Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule: StoredAlertRule = {
      id: `rule_${Date.now()}`,
      name: newRuleName.trim(),
      ruleType: newRuleType,
      enabled: true,
      createdAt: Date.now(),
      squawkCode: newRuleType === 'EMERGENCY_SQUAWK' ? newRuleSquawk.trim() : undefined,
      thresholdAltitude: newRuleType === 'ALTITUDE_CEILING' ? parseInt(newRuleAltitude, 10) || 40000 : undefined,
    };

    if (persistenceAdapter.saveAlertRule) {
      await persistenceAdapter.saveAlertRule(newRule, user?.id);
      await loadAlertRules();
    }

    setNewRuleName('');
    setShowAddRuleForm(false);
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

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {/* Operator Auth indicator */}
          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300">
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold hidden md:inline truncate max-w-[120px]">
                {profile?.displayName || user.email?.split('@')[0]}
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                CLOUD SYNC
              </span>
              <button
                onClick={signOut}
                title="Disconnect Operator"
                className="text-slate-400 hover:text-rose-400 transition-colors ml-1"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-slate-300 hover:text-white transition-colors"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>SIGN IN</span>
            </button>
          )}

          <Link
            href="/airports"
            className="hidden sm:inline-block px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
          >
            AIRPORTS
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors shadow-lg shadow-sky-500/20"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>RADAR</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-8 sm:px-8 space-y-8 font-mono">
        {/* Airspace Analytics Summary Banner */}
        <div className="p-6 rounded-2xl bg-[#080d1a] border border-[#1f293d] shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#1f293d]/80">
            <div>
              <span className="text-[10px] text-sky-400 uppercase tracking-widest font-semibold block">
                INTELLIGENCE OVERVIEW &bull; CONUS AIRSPACE
              </span>
              <h2 className="text-xl font-bold text-white tracking-wide mt-1">
                Active Observatory Fleet Status
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {isLoadingTraffic ? 'ACQUIRING ADS-B...' : `${totalObserved.toLocaleString()} TRANSPONDERS ACTIVE`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4">
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">STRATO (&gt;28K FT)</div>
              <div className="text-lg font-bold text-sky-300 mt-1">{stratoCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">CRUISE (18-28K)</div>
              <div className="text-lg font-bold text-cyan-300 mt-1">{cruiseCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">TERMINAL (&lt;18K)</div>
              <div className="text-lg font-bold text-emerald-300 mt-1">{termCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">SURFACE / GND</div>
              <div className="text-lg font-bold text-slate-400 mt-1">{gndCount}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#040711] border border-slate-800/80">
              <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">EMERGENCY (7700)</div>
              <div className={`text-lg font-bold mt-1 ${emergencyCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`}>
                {emergencyCount}
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation & Cloud Sync Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1f293d] pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
                activeTab === 'saved'
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>SAVED FLIGHTS</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#040711] text-[10px] border border-slate-800">
                {savedFlights.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('watchlists')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
                activeTab === 'watchlists'
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>WATCHLISTS</span>
              <span className="px-1.5 py-0.5 rounded-full bg-[#040711] text-[10px] border border-slate-800">
                {watchlists.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wider transition-all ${
                activeTab === 'alerts'
                  ? 'bg-sky-500/20 border border-sky-500/40 text-sky-300 shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>ALERTS &amp; RULES</span>
              {unreadAlertsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[10px] border border-rose-500/40 animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </button>
          </div>

          {/* Backup / Export / Storage Mode Controls */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[10px] text-slate-500 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#080d1a] border border-[#1f293d]">
              <Database className="w-3 h-3 text-sky-400" />
              <span>{user ? 'STORAGE: CLOUD RLS' : 'STORAGE: DEVICE-LOCAL'}</span>
            </span>

            <button
              onClick={handleExportBackup}
              title="Download local JSON backup"
              className="p-1.5 rounded-lg bg-[#080d1a] border border-[#1f293d] text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <label
              title="Restore local JSON backup"
              className="p-1.5 rounded-lg bg-[#080d1a] border border-[#1f293d] text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300">
            {importStatus}
          </div>
        )}

        {/* TAB 1: SAVED FLIGHTS */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {savedFlights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-4 rounded-2xl bg-[#080d1a] border border-[#1f293d] hover:border-sky-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {flight.callsign || flight.id.toUpperCase()}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                            {flight.id.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          {flight.aircraftType || 'Civilian Aircraft'} &bull;{' '}
                          {flight.registration || 'Reg Unlisted'}
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-sky-400">
                        <Plane className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#1f293d]/50 text-xs">
                      <span className="text-[10px] text-slate-500">
                        Saved {new Date(flight.savedAt).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/flight/${flight.id}`}
                          className="px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 flex items-center gap-1.5 transition-colors"
                        >
                          <span>OPEN DOSSIER</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          onClick={() =>
                            toggleSaveFlight({
                              id: flight.id,
                              callsign: flight.callsign || flight.id.toUpperCase(),
                              latitude: 0,
                              longitude: 0,
                              altitude: 0,
                              heading: 0,
                              speed: 0,
                              timestamp: Date.now(),
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

        {/* TAB 3: AIRSPACE ALERTS & CONFIGURED RULES */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            {/* 1. Alert Rules Management Section */}
            <div className="p-5 rounded-2xl bg-[#080d1a] border border-[#1f293d] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#1f293d]/80">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white tracking-wider">
                    CONFIGURED ALERT RULES
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddRuleForm(!showAddRuleForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddRuleForm ? 'CANCEL' : 'ADD CRITERIA'}</span>
                </button>
              </div>

              {/* Add New Rule Form */}
              {showAddRuleForm && (
                <form onSubmit={handleCreateRule} className="p-4 rounded-xl bg-[#040711] border border-slate-800 space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      RULE NAME
                    </label>
                    <input
                      type="text"
                      required
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                      placeholder="e.g. VIP Transport Intercept, Stratospheric Ceiling"
                      className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1f293d] text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        TRIGGER TYPE
                      </label>
                      <select
                        value={newRuleType}
                        onChange={(e) => setNewRuleType(e.target.value as StoredAlertRule['ruleType'])}
                        className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1f293d] text-white focus:outline-none focus:border-sky-500"
                      >
                        <option value="EMERGENCY_SQUAWK">Emergency Transponder Squawk</option>
                        <option value="ALTITUDE_CEILING">Altitude Ceiling Excursion</option>
                        <option value="WATCHLIST_MATCH">Watchlist Target Detected</option>
                      </select>
                    </div>

                    {newRuleType === 'EMERGENCY_SQUAWK' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          SQUAWK CODE
                        </label>
                        <input
                          type="text"
                          value={newRuleSquawk}
                          onChange={(e) => setNewRuleSquawk(e.target.value)}
                          placeholder="7700 (Emergency), 7600 (Comms)"
                          className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1f293d] text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    )}

                    {newRuleType === 'ALTITUDE_CEILING' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          THRESHOLD ALTITUDE (FT)
                        </label>
                        <input
                          type="number"
                          value={newRuleAltitude}
                          onChange={(e) => setNewRuleAltitude(e.target.value)}
                          placeholder="40000"
                          className="w-full px-3 py-2 rounded-xl bg-[#080d1a] border border-[#1f293d] text-white focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold"
                    >
                      SAVE ALERT RULE
                    </button>
                  </div>
                </form>
              )}

              {/* Rules List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alertRules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                      rule.enabled
                        ? 'bg-[#040711] border-slate-800'
                        : 'bg-[#040711]/40 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">{rule.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {rule.ruleType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {rule.squawkCode && `Target Squawk: ${rule.squawkCode}`}
                        {rule.thresholdAltitude && `Ceiling: ${rule.thresholdAltitude.toLocaleString()} ft`}
                        {rule.ruleType === 'WATCHLIST_MATCH' && 'Matches any monitored transponder hex'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule)}
                        className={`p-1 rounded-lg transition-colors ${
                          rule.enabled ? 'text-emerald-400 hover:text-emerald-300' : 'text-slate-600 hover:text-slate-400'
                        }`}
                        title={rule.enabled ? 'Disable Rule' : 'Enable Rule'}
                      >
                        {rule.enabled ? (
                          <ToggleRight className="w-6 h-6" />
                        ) : (
                          <ToggleLeft className="w-6 h-6" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Real-Time Transponder Event Log */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold tracking-wider">REAL-TIME TRANSPONDER EVENT LOG</span>
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
          </div>
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsImportModalOpen(true)}
      />
      <ImportLocalDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </div>
  );
}
