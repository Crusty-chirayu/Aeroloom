'use client';

import React, { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return typeof navigator !== 'undefined' ? !navigator.onLine : false;
}

function getServerSnapshot() {
  return false;
}

export function OfflineBanner() {
  const isOffline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-0 inset-x-0 z-[100] bg-[#14171E] text-[#F6F4EE] border-b border-[var(--signal)] px-4 py-2 text-xs font-mono flex items-center justify-between shadow-lg transition-transform duration-300"
    >
      <div className="flex items-center gap-2.5 max-w-5xl mx-auto w-full">
        <span className="w-2.5 h-2.5 rounded-full bg-[var(--signal)] animate-pulse shrink-0" />
        <span className="font-bold text-[var(--signal)]">OFFLINE MODE</span>
        <span className="text-neutral-400 hidden sm:inline">·</span>
        <span className="text-neutral-300 truncate">
          Live telemetry stream disconnected. Retaining local cached airspace coordinates.
        </span>
      </div>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 hover:bg-white/20 text-white shrink-0 cursor-pointer transition-colors"
      >
        Retry Reconnect
      </button>
    </div>
  );
}
