interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private defaultLimit: number;
  private defaultWindowMs: number;

  constructor(defaultLimit: number = 60, defaultWindowMs: number = 60000) {
    this.defaultLimit = defaultLimit;
    this.defaultWindowMs = defaultWindowMs;
  }

  check(
    ip: string,
    limit: number = this.defaultLimit,
    windowMs: number = this.defaultWindowMs
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    const cleanIp = ip || 'unknown-client';
    const record = this.records.get(cleanIp);

    if (!record || now > record.resetAt) {
      this.records.set(cleanIp, {
        count: 1,
        resetAt: now + windowMs,
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetMs: windowMs,
      };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetMs: Math.max(0, record.resetAt - now),
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetMs: Math.max(0, record.resetAt - now),
    };
  }

  prune(): void {
    const now = Date.now();
    for (const [k, v] of this.records.entries()) {
      if (now > v.resetAt) {
        this.records.delete(k);
      }
    }
  }

  clear(): void {
    this.records.clear();
  }
}

export const globalRateLimiter = new RateLimiter();
