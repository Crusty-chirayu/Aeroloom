import type { CacheService } from './types.ts';
import { MemoryCacheService } from './memoryCache.ts';

/**
 * Upstash Redis Cache implementation using lightweight HTTP REST API.
 * Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * Degrades gracefully to MemoryCacheService if env vars are unset or calls fail.
 */
export class UpstashRedisCacheService implements CacheService {
  private url?: string;
  private token?: string;
  private fallback: MemoryCacheService;

  constructor(fallback?: MemoryCacheService) {
    this.url = process.env.UPSTASH_REDIS_REST_URL;
    this.token = process.env.UPSTASH_REDIS_REST_TOKEN;
    this.fallback = fallback || new MemoryCacheService();
  }

  get isConfigured(): boolean {
    return Boolean(this.url && this.token);
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isConfigured) {
      return this.fallback.get<T>(key);
    }

    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        return this.fallback.get<T>(key);
      }

      const data = await res.json();
      if (!data || data.result === null || data.result === undefined) {
        return null;
      }

      if (typeof data.result === 'string') {
        try {
          return JSON.parse(data.result) as T;
        } catch {
          return data.result as unknown as T;
        }
      }

      return data.result as T;
    } catch {
      return this.fallback.get<T>(key);
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    // Always populate fallback memory cache for sub-millisecond local reads
    await this.fallback.set(key, value, ttlSeconds);

    if (!this.isConfigured) {
      return;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      await fetch(
        `${this.url}/set/${encodeURIComponent(key)}?ex=${Math.max(1, Math.round(ttlSeconds))}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(serialized),
          cache: 'no-store',
        }
      );
    } catch {
      // Degrade silently; fallback has the data
    }
  }

  async delete(key: string): Promise<void> {
    await this.fallback.delete(key);
    if (!this.isConfigured) return;

    try {
      await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}` },
        cache: 'no-store',
      });
    } catch {
      // Ignore
    }
  }
}
