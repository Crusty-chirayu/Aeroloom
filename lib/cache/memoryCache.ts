import type { CacheService } from './types.ts';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCacheService implements CacheService {
  private store = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Evict expired entries if size exceeds limit
    if (this.store.size >= this.maxEntries) {
      this.prune();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  private prune() {
    const now = Date.now();
    for (const [k, v] of this.store.entries()) {
      if (now > v.expiresAt) {
        this.store.delete(k);
      }
    }

    // If still oversized, drop first 20% of entries (FIFO approximation)
    if (this.store.size >= this.maxEntries) {
      const keys = Array.from(this.store.keys());
      const toRemove = Math.ceil(this.maxEntries * 0.2);
      for (let i = 0; i < toRemove; i++) {
        this.store.delete(keys[i]);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }
}
