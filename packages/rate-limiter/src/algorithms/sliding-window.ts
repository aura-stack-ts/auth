import { toContent } from "@/utils.ts"
import { createMemoryStorage } from "@/memory.ts"
import type { RateLimiterAlgorithm, RateLimitResult, SlidingWindowRule } from "@/types.ts"

/**
 * Sliding Window Counter
 *
 * Interpolates between the previous fixed window's count and the current one
 * to approximate a true rolling window without storing per-request timestamps.
 *
 * Formula:
 *   weight   = elapsed time in current window / windowMs
 *   estimate = previousCount * (1 - weight) + currentCount
 *
 * O(1) storage — two counters per key — with smooth, burst-free throttling.
 *
 * Recommended for: security-sensitive endpoints (signIn, signOut, verifyToken).
 */
export const createSlidingWindowAlgorithm = <RequestInit = Request>(
    rule: SlidingWindowRule<RequestInit>
): RateLimiterAlgorithm<RequestInit> => {
    const { limit, windowMs, storage = createMemoryStorage() } = rule

    const getBoundary = (now: number) => Math.floor(now / windowMs) * windowMs

    const windowKeys = (baseKey: string, now: number) => {
        const currentBoundary = getBoundary(now)
        return {
            current: `${baseKey}:sw:${currentBoundary}`,
            previous: `${baseKey}:sw:${currentBoundary - windowMs}`,
        }
    }

    const estimate = async (baseKey: string, now: number): Promise<{ count: number; resetAt: number }> => {
        const boundary = getBoundary(now)
        const weight = (now - boundary) / windowMs
        const { current, previous } = windowKeys(baseKey, now)

        const [currentEntry, previousEntry] = await Promise.all([storage.get(current), storage.get(previous)])

        const count = (previousEntry?.value ?? 0) * (1 - weight) + (currentEntry?.value ?? 0)
        return { count, resetAt: boundary + windowMs }
    }

    const check = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const boundary = getBoundary(now)
        const reset = boundary + windowMs
        const key = rule.keyGenerator(request)
        const { current, previous } = windowKeys(key, now)

        const newCount = await storage.increment(current, windowMs * 2)
        const weight = (now - boundary) / windowMs
        const previousEntry = await storage.get(previous)
        const estimatedCount = (previousEntry?.value ?? 0) * (1 - weight) + newCount
        const ok = estimatedCount <= limit

        return toContent({
            ok,
            limit,
            remaining: Math.max(0, Math.floor(limit - estimatedCount)),
            resetAt: reset,
            retryAfter: ok ? 0 : reset - now,
        })
    }

    const peek = async (request: RequestInit): Promise<RateLimitResult> => {
        const now = Date.now()
        const key = rule.keyGenerator(request)
        const { count, resetAt } = await estimate(key, now)
        const ok = count <= limit

        return toContent({
            ok,
            limit,
            remaining: Math.max(0, Math.floor(limit - count)),
            resetAt,
            retryAfter: ok ? 0 : resetAt - now,
        })
    }

    return { check, peek }
}
