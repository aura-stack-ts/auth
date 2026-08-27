import { toContent } from "@/utils.ts"
import { createMemoryStorage } from "@/memory.ts"
import type { LeakyBucketRule, RateLimiterAlgorithm, RateLimitResult, StorageEntry } from "@/types.ts"

interface BucketState {
    level: number
    lastLeakAt: number
}

/**
 * Leaky Bucket
 *
 * Models a bucket that accumulates requests and drains at a constant rate.
 * When full, new requests are dropped immediately. Unlike token bucket, there
 * is no burst tolerance — the output rate is always exactly `leakRatePerMs`.
 *
 *   currentLevel = max(0, storedLevel - elapsed * leakRatePerMs)
 *   newLevel     = currentLevel + 1
 *   ok           = newLevel <= capacity
 *
 * Rejected requests do NOT raise the level — a hammering client cannot
 * permanently block legitimate traffic.
 *
 * Recommended for: outbound webhook dispatch, downstream call smoothing.
 */
export const createLeakyBucketAlgorithm = <RequestInit = Request, Context = never>(
    rule: LeakyBucketRule<RequestInit, Context>
): RateLimiterAlgorithm<RequestInit, Context> => {
    const { capacity, leakRatePerMs } = rule
    const storage = rule.storage ?? createMemoryStorage()

    const levelKey = (key: string) => `${key}:lb:level`
    const lastLeakKey = (key: string) => `${key}:lb:lastLeak`
    const fullDrainMs = () => Math.ceil(capacity / leakRatePerMs)

    const getCurrentLevel = (stored: BucketState, now: number): number => {
        return Math.max(0, stored.level - Math.max(0, now - stored.lastLeakAt) * leakRatePerMs)
    }

    const readBucket = async (key: string, now: number): Promise<BucketState> => {
        const [levelEntry, leakEntry] = await Promise.all([storage.get(levelKey(key)), storage.get(lastLeakKey(key))])

        if (!levelEntry || !leakEntry) return { level: 0, lastLeakAt: now }
        return { level: levelEntry.value, lastLeakAt: leakEntry.value }
    }

    const writeBucket = async (key: string, state: BucketState): Promise<void> => {
        const ttlMs = fullDrainMs() * 2
        const expiresAt = Date.now() + ttlMs

        await Promise.all([
            storage.set(levelKey(key), { value: state.level, expiresAt } satisfies StorageEntry, ttlMs),
            storage.set(lastLeakKey(key), { value: state.lastLeakAt, expiresAt } satisfies StorageEntry, ttlMs),
        ])
    }

    const resolveKey = (request: RequestInit, context?: Context): string | Promise<string> =>
        context !== undefined
            ? (rule.keyGenerator as (r: RequestInit, c: Context) => string | Promise<string>)(request, context)
            : (rule.keyGenerator as (r: RequestInit) => string | Promise<string>)(request)

    const check = async (request: RequestInit, context?: Context): Promise<RateLimitResult> => {
        const now = Date.now()
        const key = await resolveKey(request, context)
        const stored = await readBucket(key, now)
        const level = getCurrentLevel(stored, now)
        const newLevel = level + 1
        const ok = newLevel <= capacity
        const msPerRequest = 1 / leakRatePerMs

        await writeBucket(key, {
            level: ok ? newLevel : level,
            lastLeakAt: now,
        })

        return toContent({
            ok,
            limit: capacity,
            remaining: Math.max(0, capacity - (ok ? newLevel : level)),
            resetAt: now + Math.ceil(newLevel * msPerRequest),
            retryAfter: Math.ceil(msPerRequest),
        })
    }

    const peek = async (request: RequestInit, context?: Context): Promise<RateLimitResult> => {
        const now = Date.now()
        const key = await resolveKey(request, context)
        const stored = await readBucket(key, now)
        const level = getCurrentLevel(stored, now)
        const nextLevel = level + 1
        const ok = nextLevel <= capacity
        const msPerRequest = 1 / leakRatePerMs

        return toContent({
            ok,
            limit: capacity,
            remaining: Math.max(0, capacity - (ok ? nextLevel : level)),
            resetAt: now + Math.ceil(nextLevel * msPerRequest),
            retryAfter: Math.ceil(msPerRequest),
        })
    }

    const reset = async (request: RequestInit, context?: Context): Promise<void> => {
        const key = await resolveKey(request, context)
        await Promise.all([storage.delete(levelKey(key)), storage.delete(lastLeakKey(key))])
    }

    return { check, peek, reset } as RateLimiterAlgorithm<RequestInit, Context>
}
