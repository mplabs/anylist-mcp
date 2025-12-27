import type { CacheKey, SessionCacheEntry } from "./types.ts";

class SessionCache {
  private readonly ttlMs: number;
  private readonly defaultSessionId: string;
  private readonly store = new Map<string, SessionCacheEntry>();

  constructor(ttlMs: number, defaultSessionId = "default") {
    this.ttlMs = ttlMs;
    this.defaultSessionId = defaultSessionId;
  }

  get<T>(sessionId: string | undefined, key: CacheKey): T | undefined {
    if (this.ttlMs <= 0) {
      return undefined;
    }
    const entry = this.store.get(this.normalizeSessionId(sessionId));
    const cached = entry?.[key];
    if (!cached) {
      return undefined;
    }
    if (cached.expiresAt <= Date.now()) {
      this.invalidate(sessionId, key);
      return undefined;
    }
    return cached.value as T;
  }

  set<T>(sessionId: string | undefined, key: CacheKey, value: T): void {
    if (this.ttlMs <= 0) {
      return;
    }
    const normalized = this.normalizeSessionId(sessionId);
    const entry = this.store.get(normalized) ?? {};
    entry[key] = {
      value,
      expiresAt: Date.now() + this.ttlMs,
    };
    this.store.set(normalized, entry);
  }

  invalidate(sessionId: string | undefined, key?: CacheKey): void {
    if (this.ttlMs <= 0) {
      return;
    }
    const normalized = this.normalizeSessionId(sessionId);
    if (!key) {
      this.store.delete(normalized);
      return;
    }
    const entry = this.store.get(normalized);
    if (!entry) {
      return;
    }
    delete entry[key];
    if (!entry.lists && !entry.recipes) {
      this.store.delete(normalized);
    }
  }

  private normalizeSessionId(sessionId: string | undefined): string {
    if (!sessionId) {
      return this.defaultSessionId;
    }
    return sessionId;
  }
}

export { SessionCache };
