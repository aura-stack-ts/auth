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
export const createSlidingWindowAlgorithm = <RequestInit = Request, Context = never>(
    rule: SlidingWindowRule<RequestInit, Context>
): RateLimiterAlgorithm<RequestInit, Context> => {
    const { limit, windowMs } = rule
    const storage = rule.storage ?? createMemoryStorage()

    const getBoundary = (now: number) => Math.floor(now / windowMs) * windowMs

    const windowKeys = (baseKey: string, now: number) => {
        const currentBoundary = getBoundary(now)
        return {
            current: `${baseKey}:sw:${currentBoundary}`,
            previous: `${baseKey}:sw:${currentBoundary - windowMs}`,
        }
    }

    const resolveKey = (request: RequestInit, context?: Context): string | Promise<string> =>
        context !== undefined
            ? (rule.keyGenerator as (r: RequestInit, c: Context) => string | Promise<string>)(request, context)
            : (rule.keyGenerator as (r: RequestInit) => string | Promise<string>)(request)

    const estimate = async (baseKey: string, now: number): Promise<{ count: number; resetAt: number }> => {
        const boundary = getBoundary(now)
        const weight = (now - boundary) / windowMs
        const { current, previous } = windowKeys(baseKey, now)

        const [currentEntry, previousEntry] = await Promise.all([storage.get(current), storage.get(previous)])

        const count = (previousEntry?.value ?? 0) * (1 - weight) + (currentEntry?.value ?? 0)
        return { count, resetAt: boundary + windowMs }
    }

    const check = async (request: RequestInit, context?: Context): Promise<RateLimitResult> => {
        const now = Date.now()
        const boundary = getBoundary(now)
        const reset = boundary + windowMs
        const key = await resolveKey(request, context)
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

    const peek = async (request: RequestInit, context?: Context): Promise<RateLimitResult> => {
        const key = await resolveKey(request, context)
        const now = Date.now()
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

    const reset = async (request: RequestInit, context?: Context): Promise<void> => {
        const now = Date.now()
        const key = await resolveKey(request, context)
        const { current, previous } = windowKeys(key, now)
        await Promise.all([storage.delete(current), storage.delete(previous)])
    }

    return { check, peek, reset } as RateLimiterAlgorithm<RequestInit, Context>
}
