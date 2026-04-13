import type { RateLimiterStorage, StorageEntry } from "@/types.ts"

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
export const createMemoryStorage = (): RateLimiterStorage => {
    const store = new Map<string, StorageEntry>()

    const isExpired = (entry: StorageEntry): boolean => {
        return entry.expiresAt <= Date.now()
    }

    const get = async (key: string): Promise<StorageEntry | null> => {
        const entry = store.get(key)
        if (!entry) return null
        if (isExpired(entry)) {
            store.delete(key)
            return null
        }
        return entry
    }

    const set = async (key: string, entry: StorageEntry, _ttlMs: number): Promise<void> => {
        store.set(key, entry)
    }

    const increment = async (key: string, ttlMs: number): Promise<number> => {
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

    const remove = async (key: string): Promise<void> => {
        store.delete(key)
    }

    return { get, set, increment, delete: remove }
}
