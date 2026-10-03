'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AeroloomLogo } from '@/components/brand/AeroloomLogo';
import { SiteFooter } from '@/components/footer/SiteFooter';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

interface ProviderDetail {
  status: 'operational' | 'degraded' | 'open';
  circuitState: string;
  lastHttpStatus: number | null;
  lastSuccessTime: number | null;
  lastError: string | null;
}

interface StatusResponse {
  status: 'operational' | 'degraded' | 'down';
  uptimeSeconds: number;
  timestamp: string;
  environment: string;
  providers: {
    primaryAdsb: string;
    failoverAdsb: string;
    airplanesLive: string;
    openSky: string;
    weather: string;
    radar: string;
    details?: Record<string, ProviderDetail>;
  };
  cache: {
    type: string;
    status: string;
  };
  rateLimiting: {
    status: string;
    windowSeconds: number;
    limitPerMinute: number;
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
      const json = await res.json();
      setData(json);
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
      .then((res) => res.json())
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
        .then((res) => res.json())
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

  const statusVariant = data?.status === 'down' ? 'bad' : data?.status === 'degraded' ? 'warn' : 'ok';
  const statusLabel =
    data?.status === 'down'
      ? 'OUTAGE DETECTED'
      : data?.status === 'degraded'
        ? 'DEGRADED TELEMETRY'
        : 'ALL SYSTEMS OPERATIONAL';

  const details = data?.providers?.details || {};

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
            <Chip variant={statusVariant} dot>{statusLabel}</Chip>
            <Chip variant="neutral">LIVE STATUS</Chip>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl text-[var(--ink)] tracking-tight">
            System &amp; Pipeline Status
          </h1>
          <p className="font-mono text-xs text-[var(--ink-2)]">
            LAST SWEEP: {lastChecked.toLocaleTimeString()} · AUTO-REFRESHES EVERY 30 SECONDS
          </p>
        </div>

        {/* Global Summary Card */}
        <Panel variant="surface" className="p-6 sm:p-8 bg-[var(--surface)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line)] pb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center border ${
                  data?.status === 'down'
                    ? 'bg-[var(--danger)]/10 border-[var(--danger)]/30 text-[var(--danger)]'
                    : data?.status === 'degraded'
                      ? 'bg-[var(--warning)]/10 border-[var(--warning)]/30 text-[var(--warning-ink)]'
                      : 'bg-[var(--ok)]/10 border-[var(--ok)]/30 text-[var(--ok)]'
                }`}
              >
                <Icon
                  name={data?.status === 'down' ? 'alert-triangle' : data?.status === 'degraded' ? 'activity' : 'check'}
                  size={24}
                />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-[var(--ink)]">
                  {data?.status === 'down'
                    ? 'Telemetry Feed Unavailable'
                    : data?.status === 'degraded'
                      ? 'Operating Under Fallback Feeds'
                      : 'All Systems Nominal'}
                </h2>
                <p className="text-xs text-[var(--ink-2)]">
                  {data?.status === 'down'
                    ? 'Every upstream provider is currently unreachable or throttling.'
                    : data?.status === 'degraded'
                      ? 'One or more upstream telemetry feeds are circuit-broken. Redundant feeds active.'
                      : 'Zero degraded telemetry pipelines or rate-limiting congestion detected.'}
                </p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-[var(--ink-2)]">
              <div>SERVER UPTIME</div>
              <div className="text-sm font-bold text-[var(--ink)] tabular-nums mt-0.5">
                {data ? formatUptime(data.uptimeSeconds) : 'Nominal'}
              </div>
            </div>
          </div>

          {/* Service Pipelines Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* adsb.fi */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">adsb.fi Feed</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok-ink)] font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      details['adsb.fi']?.circuitState === 'open' ? 'bg-[var(--danger)]' : 'bg-[var(--ok)]'
                    }`}
                  />
                  {details['adsb.fi']?.circuitState === 'open' ? 'Tripped (60s)' : 'Active (Open Data)'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">Community readsb telemetry pipeline</p>
            </div>

            {/* adsb.lol */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">adsb.lol Feed</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok-ink)] font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      details['adsb.lol']?.circuitState === 'open' ? 'bg-[var(--danger)]' : 'bg-[var(--ok)]'
                    }`}
                  />
                  {details['adsb.lol']?.circuitState === 'open' ? 'Tripped (60s)' : 'Active / Failover'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">Open collective transponder network</p>
            </div>

            {/* airplanes.live */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">airplanes.live</span>
                <span
                  className={`flex items-center gap-1.5 text-xs font-medium ${
                    details['airplanes.live']?.circuitState === 'open' ? 'text-[var(--danger)]' : 'text-[var(--ok-ink)]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      details['airplanes.live']?.circuitState === 'open' ? 'bg-[var(--danger)]' : 'bg-[var(--ok)]'
                    }`}
                  />
                  {details['airplanes.live']?.circuitState === 'open' ? 'Contact Required (403)' : 'Active'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">Upstream requires email authorization</p>
            </div>

            {/* OpenSky Network */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">OpenSky Network</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok-ink)] font-medium">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      details['opensky-network']?.circuitState === 'open' ? 'bg-[var(--danger)]' : 'bg-[var(--ok)]'
                    }`}
                  />
                  {details['opensky-network']?.circuitState === 'open' ? 'Rate Limited' : 'Active (CC BY 4.0)'}
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">Academic open ADS-B research network</p>
            </div>

            {/* Radar */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Doppler Weather Radar</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok-ink)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">RainViewer composite mosaic API</p>
            </div>

            {/* Weather */}
            <div className="p-4 rounded bg-[var(--paper-2)] border border-[var(--line)] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-[var(--ink)]">Aviation METAR Weather</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--ok-ink)] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ok)]" />
                  Active
                </span>
              </div>
              <p className="text-xs text-[var(--ink-2)]">aviationweather.gov NOAA observations</p>
            </div>
          </div>
        </Panel>
      </main>

      <SiteFooter />
    </div>
  );
}
