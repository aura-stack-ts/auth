import type { RateLimiterAlgorithm, RateLimiterStorage, RateLimitResult, StorageEntry, TokenBucketRule } from "@/types"

/**
 * Token Bucket
 *
 * Models a bucket that holds up to `capacity` tokens and refills at
 * `refillRatePerMs` tokens/ms. Each request drains one token.
 * When the bucket is empty the request is rejected.
 *
 * Properties:
 * - Allows short bursts up to `capacity`.
 * - Smooths sustained traffic to `refillRatePerMs * 1000` requests/sec.
 * - State is two numbers (tokens, lastRefillAt) — O(1) per key.
 */
interface BucketState {
    tokens: number
    lastRefillAt: number
}

const SEPARATOR = ":tb:"

export const createTokenBucketAlgorithm = (rule: TokenBucketRule): RateLimiterAlgorithm => {
    const { capacity, refillRatePerMs } = rule

    const tokensKey = (key: string) => {
        return `${key}${SEPARATOR}tokens`
    }

    const lastRefillKey = (key: string) => {
        return `${key}${SEPARATOR}lastRefill`
    }

    const refill = (storedTokens: number, lastRefillAt: number, now: number): number => {
        const elapsed = Math.max(0, now - lastRefillAt)
        const earned = elapsed * refillRatePerMs
        return Math.min(capacity, storedTokens + earned)
    }

    const readBucket = async (key: string, storage: RateLimiterStorage, now: number): Promise<BucketState> => {
        const tKey = tokensKey(key)
        const rKey = lastRefillKey(key)

        const [tokensEntry, refillEntry] = await Promise.all([storage.get(tKey), storage.get(rKey)])

        if (!tokensEntry || !refillEntry) {
            return { tokens: capacity, lastRefillAt: now }
        }

        return {
            tokens: tokensEntry.value,
            lastRefillAt: refillEntry.value,
        }
    }

    const writeBucket = async (key: string, storage: RateLimiterStorage, state: BucketState): Promise<void> => {
        const ttlMs = Math.ceil((capacity / refillRatePerMs) * 2)
        const tKey = tokensKey(key)
        const rKey = lastRefillKey(key)

        const tokensEntry: StorageEntry = { value: state.tokens, expiresAt: Date.now() + ttlMs }
        const refillEntry: StorageEntry = { value: state.lastRefillAt, expiresAt: Date.now() + ttlMs }

        await Promise.all([storage.set(tKey, tokensEntry, ttlMs), storage.set(rKey, refillEntry, ttlMs)])
    }

    const check = async (key: string, storage: RateLimiterStorage): Promise<RateLimitResult> => {
        const now = Date.now()
        const stored = await readBucket(key, storage, now)
        const currentTokens = refill(stored.tokens, stored.lastRefillAt, now)

        const allowed = currentTokens >= 1
        const newTokens = allowed ? currentTokens - 1 : currentTokens

        await writeBucket(key, storage, { tokens: newTokens, lastRefillAt: now })

        const msPerToken = 1 / refillRatePerMs
        const resetAt = now + Math.ceil((capacity - newTokens) * msPerToken)

        return {
            allowed,
            limit: capacity,
            remaining: Math.floor(newTokens),
            resetAt,
            ...(allowed ? {} : { retryAfter: Math.ceil(msPerToken) }),
        }
    }

    const peek = async (key: string, storage: RateLimiterStorage): Promise<RateLimitResult> => {
        const now = Date.now()
        const stored = await readBucket(key, storage, now)
        const currentTokens = refill(stored.tokens, stored.lastRefillAt, now)

        const allowed = currentTokens >= 1
        const msPerToken = 1 / refillRatePerMs
        const resetAt = now + Math.ceil((capacity - currentTokens) * msPerToken)

        return {
            allowed,
            limit: capacity,
            remaining: Math.floor(currentTokens),
            resetAt,
            ...(allowed ? {} : { retryAfter: Math.ceil(msPerToken) }),
        }
    }

    return { check, peek }
}
