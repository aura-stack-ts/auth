import { toContent } from "@/utils.ts"
import { createMemoryStorage } from "@/memory.ts"
import type { RateLimiterAlgorithm, RateLimitResult, StorageEntry, TokenBucketRule } from "@/types.ts"

/**
 * Token Bucket
 *
 * Models a bucket that holds up to `capacity` tokens and refills at
 * `refillRate` tokens/ms. Each request drains one token.
 * When the bucket is empty the request is rejected.
 *
 * - Allows short bursts up to `capacity`.
 * - Smooths sustained traffic to `refillRate * 1000` req/sec.
 * - State: two numbers (tokens, lastRefillAt) — O(1) per key.
 *
 * Recommended for: functional, user-initiated endpoints (getSession, refresh).
 */

interface BucketState {
    tokens: number
    lastRefillAt: number
}

export const createTokenBucketAlgorithm = <RequestInit = Request>(
    rule: TokenBucketRule<RequestInit>
): RateLimiterAlgorithm<RequestInit> => {
    const { capacity, refillRate, storage = createMemoryStorage() } = rule

    if (!Number.isFinite(capacity) || capacity <= 0) {
        throw new Error(`[rate-limiter] Invalid token-bucket capacity: ${capacity}`)
    }
    if (!Number.isFinite(refillRate) || refillRate <= 0) {
        throw new Error(`[rate-limiter] Invalid token-bucket refillRate: ${refillRate}`)
    }

    const tokensKey = (key: string) => `${key}:tb:tokens`
    const lastRefillKey = (key: string) => `${key}:tb:lastRefill`
    const getTTL = () => Math.ceil((capacity / refillRate) * 2)

    const refill = (tokens: number, lastRefillAt: number, now: number): number => {
        return Math.min(capacity, tokens + Math.max(0, now - lastRefillAt) * refillRate)
    }

    const getBucketState = async (key: string, now: number): Promise<BucketState> => {
        const [tokensEntry, refillEntry] = await Promise.all([storage.get(tokensKey(key)), storage.get(lastRefillKey(key))])
        if (!tokensEntry && !refillEntry) {
            return { tokens: capacity, lastRefillAt: now }
        }
        if (!tokensEntry || !refillEntry) {
            return { tokens: tokensEntry?.value ?? 0, lastRefillAt: refillEntry?.value ?? now }
        }
        return { tokens: tokensEntry.value, lastRefillAt: refillEntry.value }
    }

    const setBucketState = async (key: string, state: BucketState): Promise<void> => {
        const ttl = getTTL()
        const expiresAt = Date.now() + ttl
        const tokensEntry: StorageEntry = { value: state.tokens, expiresAt }
        const refillEntry: StorageEntry = { value: state.lastRefillAt, expiresAt }
        await Promise.all([storage.set(tokensKey(key), tokensEntry, ttl), storage.set(lastRefillKey(key), refillEntry, ttl)])
    }

    const check = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const key = rule.keyGenerator(request)
        const state = await getBucketState(key, now)
        const tokens = refill(state.tokens, state.lastRefillAt, now)
        const ok = tokens >= 1
        const newTokens = ok ? tokens - 1 : tokens
        await setBucketState(key, { tokens: newTokens, lastRefillAt: now })

        const msPerToken = 1 / refillRate
        const resetAt = now + Math.ceil((capacity - newTokens) * msPerToken)

        return toContent({
            ok,
            limit: capacity,
            remaining: Math.floor(newTokens),
            resetAt,
            retryAfter: ok ? 0 : Math.ceil(msPerToken),
        })
    }

    const peek = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const key = rule.keyGenerator(request)
        const stored = await getBucketState(key, now)
        const currentTokens = refill(stored.tokens, stored.lastRefillAt, now)
        const ok = currentTokens >= 1
        const msPerToken = 1 / refillRate
        const resetAt = now + Math.ceil((capacity - currentTokens) * msPerToken)

        return toContent({
            ok,
            limit: capacity,
            remaining: Math.floor(currentTokens),
            resetAt,
            retryAfter: ok ? 0 : Math.ceil(msPerToken),
        })
    }

    return { check, peek }
}
