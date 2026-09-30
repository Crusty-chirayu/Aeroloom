import { UpstashRedisCacheService } from './upstashRedis.ts';
import { MemoryCacheService } from './memoryCache.ts';
import type { CacheService } from './types.ts';

export * from './types.ts';
export * from './memoryCache.ts';
export * from './upstashRedis.ts';
export * from './coalescing.ts';
export * from './rateLimiter.ts';

let defaultCache: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!defaultCache) {
    const memory = new MemoryCacheService(1000);
    defaultCache = new UpstashRedisCacheService(memory);
  }
  return defaultCache;
}
