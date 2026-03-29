import type { RateLimiterStorage, StorageEntry } from "@/types"

/**
 * In-process storage backed by a plain `Map`.
 *
 * - Zero dependencies.
 * - Suitable for single-instance deployments, serverless warm instances, and
 *   local development.
 * - Not suitable for multi-replica deployments; use a shared store (Redis,
 *   Cloudflare KV, …) for those.
 *
 * Expired entries are cleaned up lazily on `get` and proactively on a
 * configurable sweep interval so memory does not grow unbounded.
 */
export function createMemoryStorage(sweepIntervalMs = 60_000): RateLimiterStorage {
    const store = new Map<string, StorageEntry>()

    let sweepTimer: ReturnType<typeof setInterval> | undefined

    function startSweep() {
        if (sweepIntervalMs <= 0) return
        sweepTimer = setInterval(() => {
            const now = Date.now()
            for (const [key, entry] of store) {
                if (entry.expiresAt <= now) store.delete(key)
            }
        }, sweepIntervalMs)

        if (typeof sweepTimer === "object" && "unref" in sweepTimer) {
            sweepTimer.unref()
        }
    }

    startSweep()

    function isExpired(entry: StorageEntry): boolean {
        return entry.expiresAt <= Date.now()
    }

    async function get(key: string): Promise<StorageEntry | null> {
        const entry = store.get(key)
        if (!entry) return null
        if (isExpired(entry)) {
            store.delete(key)
            return null
        }
        return entry
    }

    async function set(key: string, entry: StorageEntry, _ttlMs: number): Promise<void> {
        store.set(key, entry)
    }

    async function increment(key: string, ttlMs: number): Promise<number> {
        const now = Date.now()
        const existing = store.get(key)

        if (!existing || isExpired(existing)) {
            const entry: StorageEntry = { value: 1, expiresAt: now + ttlMs }
            store.set(key, entry)
            return 1
        }

        existing.value += 1
        return existing.value
    }

    async function del(key: string): Promise<void> {
        store.delete(key)
    }

    return { get, set, increment, delete: del }
}
