'use client';

import React, { useState } from 'react';
import type { WeatherReport } from '@/lib/providers/types';
import { Chip } from '@/components/ui/Chip';
import { Panel } from '@/components/ui/Panel';
import { Icon } from '@/components/ui/Icon';

interface MetarWeatherCardProps {
  weather: WeatherReport | null;
  isLoading?: boolean;
  className?: string;
}

export function MetarWeatherCard({
  weather,
  isLoading = false,
  className = '',
}: MetarWeatherCardProps) {
  const [showRaw, setShowRaw] = useState(false);

  if (isLoading) {
    return (
      <Panel variant="surface" radius="md" padding="md" className={`space-y-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 bg-[var(--line)] rounded" />
          <div className="h-6 w-16 bg-[var(--line)] rounded-full" />
        </div>
        <div className="h-8 w-3/4 bg-[var(--line)] rounded" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-14 bg-[var(--paper-2)] rounded" />
          ))}
        </div>
      </Panel>
    );
  }

  if (!weather) {
    return (
      <Panel variant="surface" radius="md" padding="md" className={`space-y-3 ${className}`}>
        <div className="flex items-center justify-between">
          <span className="mono-label text-[11px] text-[var(--ink-3)]">AERODROME METEOROLOGICAL OBSERVATION</span>
          <Chip variant="neutral">OFFLINE</Chip>
        </div>
        <p className="text-sm text-[var(--ink-2)]">
          Live METAR weather observations are currently unrecorded or unavailable for this station via NOAA / aviationweather.gov.
        </p>
      </Panel>
    );
  }

  const categoryColor: Record<string, 'ok' | 'sky' | 'warn' | 'bad'> = {
    VFR: 'ok',
    MVFR: 'sky',
    IFR: 'warn',
    LIFR: 'bad',
  };

  const catVariant = categoryColor[weather.flightCategory] || 'ok';
  const windDir = weather.wind?.directionDeg || 0;
  const windSpd = weather.wind?.speedKt || 0;
  const windGust = weather.wind?.gustKt;

  return (
    <Panel variant="surface" radius="md" padding="md" className={`space-y-5 ${className}`}>
      {/* Category & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-3">
        <div className="flex items-center gap-3">
          <span className="mono-label text-[11px] text-[var(--ink-3)]">
            STATION WEATHER REPORT (METAR)
          </span>
          <Chip variant={catVariant} dot>
            {weather.flightCategory} · {weather.flightCategory === 'VFR' ? 'Visual Flight Rules' : weather.flightCategory === 'MVFR' ? 'Marginal VFR' : weather.flightCategory === 'IFR' ? 'Instrument Flight Rules' : 'Low IFR'}
          </Chip>
        </div>

        {weather.observationTime && (
          <span className="font-mono text-xs text-[var(--ink-3)]">
            OBS: {new Date(weather.observationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
          </span>
        )}
      </div>

      {/* Wind & Primary Condition Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="font-serif text-2xl md:text-3xl text-[var(--ink)] leading-snug">
            {weather.summary}
          </div>
          <div className="text-xs font-mono text-[var(--ink-3)]">
            Decoded in plain language from official aviation observation feed.
          </div>
        </div>

        {/* Wind Vector Compass Widget */}
        <div className="flex items-center gap-4 bg-[var(--paper)] px-4 py-3 rounded-[var(--r-md)] border border-[var(--line)] shrink-0">
          <div className="relative w-12 h-12 rounded-full border border-[var(--line-strong)] bg-[var(--surface)] flex items-center justify-center shadow-inner">
            {/* Cardinal points */}
            <span className="absolute top-0.5 text-[7px] font-mono font-bold text-[var(--ink-3)]">N</span>
            <span className="absolute bottom-0.5 text-[7px] font-mono text-[var(--ink-4)]">S</span>
            <span className="absolute right-1 text-[7px] font-mono text-[var(--ink-4)]">E</span>
            <span className="absolute left-1 text-[7px] font-mono text-[var(--ink-4)]">W</span>
            {/* Rotated Wind Arrow */}
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-500"
              style={{ transform: `rotate(${windDir}deg)` }}
              aria-label={`Wind direction ${windDir} degrees`}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" className="text-[var(--signal)] fill-current drop-shadow-sm">
                <path d="M12 2L6 14H10V22H14V14H18L12 2Z" />
              </svg>
            </div>
          </div>

          <div>
            <div className="mono-label text-[10px] text-[var(--ink-3)]">SURFACE WIND</div>
            <div className="font-mono text-lg font-bold text-[var(--ink)]">
              {windDir.toString().padStart(3, '0')}° / {windSpd} <span className="text-xs font-normal text-[var(--ink-3)]">KT</span>
            </div>
            {windGust && (
              <div className="text-[11px] font-mono text-[var(--bad)] font-semibold">
                GUSTS TO {windGust} KT
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Atmospheric Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="mono-label text-[10px] text-[var(--ink-3)] block">VISIBILITY</span>
          <span className="font-mono text-lg font-bold text-[var(--ink)]">
            {weather.visibilitySm !== undefined ? `${weather.visibilitySm} SM` : '10+ SM'}
          </span>
          <span className="text-[10px] font-mono text-[var(--ink-3)] block mt-0.5">
            {weather.visibilitySm && weather.visibilitySm >= 6 ? 'UNRESTRICTED' : 'REDUCED'}
          </span>
        </div>

        <div className="p-3 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="mono-label text-[10px] text-[var(--ink-3)] block">CLOUD CEILING</span>
          <span className="font-mono text-lg font-bold text-[var(--ink)]">
            {weather.ceilingFt !== undefined ? `${weather.ceilingFt.toLocaleString()} FT` : 'CLR / SKC'}
          </span>
          <span className="text-[10px] font-mono text-[var(--ink-3)] block mt-0.5">
            {weather.ceilingFt ? 'ABOVE GROUND LEVEL' : 'CLEAR SKY'}
          </span>
        </div>

        <div className="p-3 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="mono-label text-[10px] text-[var(--ink-3)] block">TEMP / DEWPOINT</span>
          <span className="font-mono text-lg font-bold text-[var(--ink)]">
            {weather.temperatureC !== undefined ? `${weather.temperatureC}°C` : '—'}
            {weather.dewpointC !== undefined ? ` / ${weather.dewpointC}°C` : ''}
          </span>
          <span className="text-[10px] font-mono text-[var(--ink-3)] block mt-0.5">
            {weather.temperatureC !== undefined ? `${Math.round(weather.temperatureC * 1.8 + 32)}°F` : ''}
          </span>
        </div>

        <div className="p-3 rounded-[var(--r-sm)] bg-[var(--paper)] border border-[var(--line)]">
          <span className="mono-label text-[10px] text-[var(--ink-3)] block">ALTIMETER (QNH)</span>
          <span className="font-mono text-lg font-bold text-[var(--ink)]">
            {weather.altimeterInHg !== undefined ? `${weather.altimeterInHg.toFixed(2)}` : '29.92'} <span className="text-xs font-normal text-[var(--ink-3)]">inHg</span>
          </span>
          <span className="text-[10px] font-mono text-[var(--ink-3)] block mt-0.5">
            {weather.altimeterInHg ? `${Math.round(weather.altimeterInHg * 33.8639)} hPa` : '1013 hPa'}
          </span>
        </div>
      </div>

      {/* Raw METAR collapsible drawer */}
      <div className="border-t border-[var(--line)] pt-3">
        <button
          type="button"
          onClick={() => setShowRaw(!showRaw)}
          className="flex items-center gap-2 text-xs font-mono text-[var(--ink-2)] hover:text-[var(--signal)] transition-colors focus:outline-none"
        >
          <Icon name={showRaw ? 'chevron-down' : 'chevron-right'} size={14} />
          <span>{showRaw ? 'HIDE RAW METAR TELEGRAPH' : 'VIEW RAW METAR TELEGRAPH STRING'}</span>
        </button>

        {showRaw && (
          <div className="mt-2.5 p-3 rounded-[var(--r-sm)] bg-[var(--paper-2)] border border-[var(--line)] font-mono text-xs text-[var(--ink)] break-all select-all">
            {weather.rawMetar}
          </div>
        )}
      </div>
    </Panel>
  );
}
