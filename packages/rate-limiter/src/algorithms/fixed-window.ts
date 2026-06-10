import { toContent } from "@/utils.ts"
import { createMemoryStorage } from "@/memory.ts"
import type { FixedWindowRule, RateLimiterAlgorithm, RateLimitResult } from "@/types.ts"

/**
 * Fixed Window Counter
 *
 * Divides time into discrete, non-overlapping windows of `windowMs` length.
 * A counter is incremented for each request within the current window; once
 * it hits `limit` the request is rejected until the window flips.
 *
 * Trade-offs vs sliding window:
 * - Cheaper: one storage key per identifier, one atomic increment per request.
 * - Allows a burst of up to 2× `limit` at a window boundary (last moment of
 *   the old window + first moment of the new one). Use sliding-window when
 *   that burst is unacceptable (e.g. auth endpoints).
 *
 * Recommended for: coarse-grained public API quotas where a boundary burst
 * is acceptable, or anywhere you want the simplest possible semantics.
 */
export const createFixedWindowAlgorithm = <RequestInit = Request>(
    rule: FixedWindowRule<RequestInit>
): RateLimiterAlgorithm<RequestInit> => {
    const { limit, windowMs, storage = createMemoryStorage() } = rule

    const boundary = (now: number) => Math.floor(now / windowMs) * windowMs
    const windowKey = (baseKey: string, now: number) => `${baseKey}:fw:${boundary(now)}`
    const resetAt = (now: number) => boundary(now) + windowMs

    const check = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const reset = resetAt(now)
        const key = rule.keyGenerator(request)
        const count = await storage.increment(windowKey(key, now), windowMs)
        const ok = count <= limit

        return toContent({
            ok,
            limit,
            remaining: Math.max(0, limit - count),
            resetAt: reset,
            retryAfter: ok ? 0 : reset - now,
        })
    }

    const peek = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const reset = resetAt(now)
        const key = rule.keyGenerator(request)
        const entry = await storage.get(windowKey(key, now))
        const count = entry?.value ?? 0
        const ok = count < limit

        return toContent({
            ok,
            limit,
            remaining: Math.max(0, limit - count),
            resetAt: reset,
            retryAfter: ok ? 0 : reset - now,
        })
    }

    return { check, peek }
}
