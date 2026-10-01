import { describe, it } from 'node:test';
import assert from 'node:assert';
import { RateLimiter } from '../lib/cache/rateLimiter.ts';
import { RequestCoalescer } from '../lib/cache/coalescing.ts';

describe('Part D: Backend Hardening & API Rate Limiting Verification', () => {
  it('enforces IP rate limiting and returns correct Retry-After reset values', () => {
    const limiter = new RateLimiter(5, 60000); // 5 requests per minute limit
    const ip = '192.168.1.100';

    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = limiter.check(ip, 5, 60000);
      assert.strictEqual(res.allowed, true, `Request ${i + 1} should be allowed`);
      assert.strictEqual(res.remaining, 4 - i);
    }

    // 6th request rejected
    const blockedRes = limiter.check(ip, 5, 60000);
    assert.strictEqual(blockedRes.allowed, false, '6th request must be rejected');
    assert.strictEqual(blockedRes.remaining, 0);
    assert.ok(blockedRes.resetMs > 0 && blockedRes.resetMs <= 60000, 'resetMs should be valid');

    const retryAfterSec = Math.ceil(blockedRes.resetMs / 1000);
    assert.ok(retryAfterSec >= 1 && retryAfterSec <= 60, `Retry-After ${retryAfterSec}s is valid`);
  });

  it('isolates rate limits per client IP address', () => {
    const limiter = new RateLimiter(2, 60000);
    const clientA = '10.0.0.1';
    const clientB = '10.0.0.2';

    limiter.check(clientA, 2, 60000);
    limiter.check(clientA, 2, 60000);
    assert.strictEqual(limiter.check(clientA, 2, 60000).allowed, false, 'Client A should be blocked');

    // Client B should still be allowed
    assert.strictEqual(limiter.check(clientB, 2, 60000).allowed, true, 'Client B should be allowed');
  });

  it('deduplicates concurrent requests via RequestCoalescer', async () => {
    const coalescer = new RequestCoalescer();
    let executionCount = 0;

    const worker = async () => {
      executionCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { status: 'ok', time: Date.now() };
    };

    // Trigger 5 concurrent requests with identical key
    const results = await Promise.all([
      coalescer.execute('status_key', worker),
      coalescer.execute('status_key', worker),
      coalescer.execute('status_key', worker),
      coalescer.execute('status_key', worker),
      coalescer.execute('status_key', worker),
    ]);

    assert.strictEqual(executionCount, 1, 'Worker should execute exactly once for coalesced key');
    assert.strictEqual(results.length, 5);
    assert.strictEqual(results[0].status, 'ok');
  });
});
