/**
 * Request Coalescer
 * Deduplicates in-flight promises across concurrent consumers.
 * Guarantees that multiple concurrent requests for the same key trigger exactly ONE execution.
 */
export class RequestCoalescer {
  private inFlight = new Map<string, Promise<unknown>>();

  async execute<T>(key: string, task: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = task().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }

  get inFlightCount(): number {
    return this.inFlight.size;
  }

  clear(): void {
    this.inFlight.clear();
  }
}

export const globalCoalescer = new RequestCoalescer();
