'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plane, Radio, ChevronDown, Search, Orbit, Layers, Building2, LayoutDashboard, User, LogOut, Cloud, HardDrive, Shield } from 'lucide-react';
import { AVIATION_SECTORS, type AviationSector } from '@/lib/map/config';
import { persistenceAdapter } from '@/lib/storage/persistenceAdapter';
import { useAuth } from '@/lib/auth/authContext';
import AuthModal from '@/components/auth/AuthModal';
import ImportLocalDataModal from '@/components/auth/ImportLocalDataModal';

interface ObservatoryHeaderProps {
  activeSector: AviationSector;
  onSelectSector: (sector: AviationSector) => void;
  onOpenSearch: () => void;
  onReturnToOrbit: () => void;
  onToggleBasemap?: () => void;
  activeBasemapName?: string;
  trackedCount?: number;
  isRefreshing?: boolean;
  isStale?: boolean;
}

export default function ObservatoryHeader({
  activeSector,
  onSelectSector,
  onOpenSearch,
  onReturnToOrbit,
  onToggleBasemap,
  activeBasemapName = 'CARTO Dark Matter',
  trackedCount = 0,
  isRefreshing = false,
  isStale = false,
}: ObservatoryHeaderProps) {
  const { user, profile, signOut, isConfigured } = useAuth();
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      role="banner"
      aria-label="Atmospheric Observatory Navigation and Telemetry"
      className="absolute top-3 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-6 pointer-events-none select-none"
    >
      {/* Brand & Orbit Portal Button */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onReturnToOrbit}
          aria-label="Return to 3D Orbit Landing Portal"
          title="Return to 3D Orbit Landing Portal"
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-white transition-all shadow-xl group"
        >
          <div className="w-5 h-5 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 group-hover:rotate-45 transition-transform">
            <Orbit className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold tracking-widest text-xs sm:text-sm font-mono text-slate-100">
            AEROLOOM
          </span>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/25 hidden sm:inline">
            OBSERVATORY
          </span>
        </button>

        <Link
          href="/dashboard"
          title="Personal Flight Operations & Watchlists"
          aria-label="Open Operations Dashboard"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-slate-300 hover:text-white text-xs font-mono transition-all shadow-xl"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
          <span>DASHBOARD</span>
          <span className="text-[8px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
            {persistenceAdapter.mode === 'cloud-synced' ? 'CLOUD' : 'LOCAL'}
          </span>
        </Link>

        <Link
          href="/airports"
          title="Global Airport Directory & Terminal Radar"
          aria-label="Open Airport Directory"
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-slate-300 hover:text-white text-xs font-mono transition-all shadow-xl"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-400" />
          <span>AIRPORTS</span>
        </Link>
      </div>

      {/* Floating Center Capsule: Sector Selector & Omnisearch */}
      <div className="flex items-center gap-2 pointer-events-auto">
        {/* Airspace Sector Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setIsSectorOpen((prev) => !prev)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-xs font-mono text-slate-200 transition-all shadow-xl"
          >
            <span className="text-slate-500 hidden md:inline">SECTOR:</span>
            <span className="text-sky-300 font-semibold sm:hidden">{activeSector.iata}</span>
            <span className="text-sky-300 font-semibold hidden sm:inline">{activeSector.label}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">({activeSector.iata})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                isSectorOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSectorOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsSectorOpen(false)}
              />
              <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-72 rounded-2xl bg-[#0f172a]/95 border border-[#1f293d] shadow-2xl p-1.5 z-50 font-mono backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-[#1f293d]/50 mb-1">
                  Airspace Presets
                </div>
                {AVIATION_SECTORS.map((sector) => {
                  const isSelected = sector.id === activeSector.id;
                  return (
                    <button
                      key={sector.id}
                      onClick={() => {
                        onSelectSector(sector);
                        setIsSectorOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-2 rounded-xl text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-[#1e293b] hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{sector.label}</div>
                        <div className="text-[10px] text-slate-500">{sector.description}</div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#080d1a] text-slate-400 border border-[#1f293d]">
                        {sector.iata}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Global Omnisearch Trigger */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/60 backdrop-blur-md text-xs font-mono text-slate-300 hover:text-white transition-all shadow-xl group"
          title="Search live flights or jump to coordinates (Cmd+K)"
          aria-label="Open search dialog"
        >
          <Search className="w-3.5 h-3.5 text-sky-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-slate-400">Search Flight / Callsign...</span>
          <kbd className="hidden lg:inline text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Telemetry Pulse & Basemap Selector */}
      <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
        {onToggleBasemap && (
          <button
            onClick={onToggleBasemap}
            title={`Active: ${activeBasemapName}. Toggle Basemap`}
            aria-label="Toggle map basemap style"
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-[11px] font-mono text-slate-300 hover:text-white transition-all shadow-xl"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[10px] truncate max-w-[100px]">{activeBasemapName.split(' ')[0]}</span>
          </button>
        )}

        <div
          className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono transition-colors shadow-xl ${
            isStale
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-[#080d1a]/85 border-[#1f293d] text-slate-300'
          }`}
        >
          <Radio
            className={`w-3.5 h-3.5 ${
              isStale
                ? 'text-amber-400'
                : isRefreshing
                ? 'text-sky-400 animate-spin'
                : 'text-emerald-400 animate-pulse'
            }`}
          />
          <span className="text-[10px] sm:text-[11px] font-semibold hidden sm:inline">
            {isStale ? 'FEED STALE' : isRefreshing ? 'SYNCING...' : 'ADS-B LIVE'}
          </span>
          {trackedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
              {trackedCount}
            </span>
          )}
        </div>
        {/* Operator Authentication Control */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-label="Operator account menu"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/85 border border-sky-500/30 hover:border-sky-500/60 backdrop-blur-md text-xs font-mono text-sky-300 transition-all shadow-xl"
            >
              <Shield className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-semibold max-w-[100px] truncate hidden sm:inline">
                {profile?.displayName || user.email?.split('@')[0]}
              </span>
              <ChevronDown
                className={`w-3 h-3 text-slate-400 transition-transform ${
                  isUserMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isUserMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsUserMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#080d1a]/95 border border-[#1f293d] shadow-2xl p-2 z-50 font-mono backdrop-blur-xl text-slate-200">
                  <div className="px-3 py-2 border-b border-[#1f293d]/60 mb-1">
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Authenticated Operator
                    </div>
                    <div className="text-xs font-bold text-white truncate mt-0.5">
                      {profile?.displayName || user.email}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-sky-400">
                      <Cloud className="w-3 h-3" />
                      <span>Cloud Sync & RLS Active</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-sky-400" />
                    <span>Operations Dashboard</span>
                  </Link>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      setIsImportModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    <span>Sync Local Browser Data</span>
                  </button>

                  <div className="my-1 border-t border-[#1f293d]/60" />

                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Operator</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsAuthModalOpen(true)}
            aria-label="Operator sign in"
            title="Authenticate operator for cloud sync and airspace alerts"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#080d1a]/85 border border-[#1f293d] hover:border-sky-500/50 backdrop-blur-md text-xs font-mono text-slate-300 hover:text-white transition-all shadow-xl"
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">SIGN IN</span>
          </button>
        )}
      </div>

      {/* Authentication & Data Import Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsImportModalOpen(true)}
      />
      <ImportLocalDataModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
    </header>
  );
}
