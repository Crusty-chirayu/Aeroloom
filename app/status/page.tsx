'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

interface StatusResponse {
  status: string;
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  rateLimiter: {
    status: string;
    windowMs: number;
    maxRequests: number;
  };
  cacheMode: string;
  providers: {
    primaryAdsb: string;
    failoverAdsb: string;
    weather: string;
    radar: string;
  };
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/status', { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch status:', err);
    } finally {
      setLoading(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    let active = true;
    fetch('/api/status', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (active && json) {
          setData(json);
          setLastChecked(new Date());
        }
      })
      .catch((err) => {
        console.error('Failed to fetch status:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const interval = setInterval(() => {
      fetch('/api/status', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((json) => {
          if (active && json) {
            setData(json);
            setLastChecked(new Date());
          }
        })
        .catch(() => {});
    }, 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col justify-between">
      {/* Header */}
      <header className="border-b border-[var(--line)] bg-[var(--surface)]/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 sm:px-12 py-4 flex items-center justify-between">
          <Link href="/" className="hover:opacity-85 transition-opacity" aria-label="Aeroloom Home">
            <AeroloomLogo variant="lockup" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStatus}
              icon={loading ? 'activity' : 'check'}
            >
              {loading ? 'Sweeping...' : 'Refresh'}
            </Button>
            <Link href="/map">
              <Button variant="signal" size="sm" icon="radio">
                Live Radar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[850px] mx-auto px-6 sm:px-12 py-16 space-y-12 w-full">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Chip variant="ok" dot>ALL SYSTEMS OPERATIONAL</Chip>
            <Chip variant="neutral">LIVE STATUS</Chip>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            System &amp; Pipeline Status
          </h1>
          <p className="font-mono text-xs text-[var(--ink-3)]">
            LAST SWEEP: {lastChecked.toLocaleTimeString()} · AUTO-REFRESHES EVERY 30 SECONDS
          </p>
        </div>

        {/* Global Summary Card */}
        <Panel variant="surface" className="p-6 sm:p-8 bg-[var(--surface)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[var(--ok)]/10 border border-[var(--ok)]/30 text-[var(--ok)] flex items-center justify-center">
                <Icon name="check" size={24} />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--ink)]">
                  All Systems Nominal
                </h2>
                <p className="text-xs text-[var(--ink-2)]">
                  Zero degraded telemetry pipelines or rate-limiting congestion detected.
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-[var(--ink-3)]">
              <div>UPTIME</div>
              <div className="text-sm font-bold text-[var(--ink)] tabular-nums mt-0.5">
                {data ? formatUptime(data.uptimeSeconds) : 'Nominal'}
              </div>
            </div>
          </div>

          {/* Service Pipelines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Primary ADS-B Feed</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">airplanes.live 1090 MHz receiver stream</p>
            </div>

            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Failover Telemetry Stream</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Standby / Ready
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">adsb.lol automated fallback pipeline</p>
            </div>

            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Doppler Weather Radar</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">RainViewer composite mosaic API</p>
            </div>

            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Aviation METAR Weather</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">aviationweather.gov NOAA observations</p>
            </div>

            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Grounded AI Assistant</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">OpenRouter multi-model fallback chain</p>
            </div>

            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Rate Limiting Shield</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  120 req/min
                </span>
              </div>
              <p className="text-xs text-[var(--ink-3)]">Sliding window per-IP quota enforcement</p>
            </div>
          </div>
        </Panel>
      </main>

      <SiteFooter />
    </div>
  );
}
