import { createMemoryStorage } from "@/memory.ts"
import {
    createTokenBucketAlgorithm,
    createFixedWindowAlgorithm,
    createLeakyBucketAlgorithm,
    createSlidingWindowAlgorithm,
} from "@/algorithms/index.ts"
import type { InferRules, RateLimiter, RateLimiterAlgorithm, RateLimiterConfig, RateLimiterRule } from "@/types.ts"

/**
 * Builds the algorithm instance for a rule, memoized per endpoint name.
 */
const buildAlgorithm = <RequestInit = Request>(rule: RateLimiterRule<RequestInit>): RateLimiterAlgorithm<RequestInit> => {
    rule.algorithm ||= "token-bucket"
    switch (rule.algorithm) {
        case "token-bucket":
            return createTokenBucketAlgorithm(rule)
        case "fixed-window":
            return createFixedWindowAlgorithm(rule)
        case "leaky-bucket":
            return createLeakyBucketAlgorithm(rule)
        case "sliding-window":
            return createSlidingWindowAlgorithm(rule)
        default: {
            throw new Error(`[rate-limiter] Unknown algorithm: "${String((rule as { algorithm?: string }).algorithm)}"`)
        }
    }
}

const resetKeys = (rule: RateLimiterRule, key: string): string[] => {
    switch (rule.algorithm) {
        case "token-bucket":
            return [`${key}:tb:tokens`, `${key}:tb:lastRefill`]
        case "fixed-window":
            return [`${key}:fw`]
        case "leaky-bucket":
            return [`${key}:lb:tokens`, `${key}:lb:lastLeak`]
        case "sliding-window":
            return [`${key}:sw:${Math.floor(Date.now() / (rule.windowMs * 2)) * rule.windowMs * 2}`]
    }
}

const buildHandle = <RequestInit = Request>(
    rule: RateLimiterRule<RequestInit>,
    algorithm: RateLimiterAlgorithm<RequestInit>,
    config: RateLimiterConfig<Record<string, RateLimiterRule>>
): RateLimiter<RequestInit> => {
    const { storage } = config

    const resolveKey = (request: RequestInit | string): string => {
        return typeof request === "string" ? request : rule.keyGenerator(request)
    }

    const check = (request: RequestInit) => {
        return algorithm.check(request)
    }

    const peek = (request: RequestInit) => {
        return algorithm.peek(request)
    }

    const reset = async (request: RequestInit | string): Promise<void> => {
        const key = resolveKey(request)
        await Promise.all(resetKeys(rule as RateLimiterRule, key).map((k) => storage!.delete(k)))
    }

    return { check, peek, reset }
}

/**
 * Creates a fully configured, runtime-agnostic rate limiter.
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({
 *   storage: createMemoryStorage(),
 *   rules: {
 *     signIn: {
 *       algorithm: 'token-bucket',
 *     },
 *     api: {
 *       algorithm: 'token-bucket',
 *     },
 *     getSession: {
 *       algorithm: 'token-bucket',
 *     },
 *   },
 * })
 *
 * ```
 */
export const createRateLimiter = <Rules extends Record<string, RateLimiterRule>>(
    config: RateLimiterConfig<Rules>
): InferRules<Rules> => {
    config.storage ||= createMemoryStorage()
    const handlers = {} as InferRules<Rules>
    for (const [rule, ruleConfig] of Object.entries(config.rules)) {
        const algorithm = buildAlgorithm(ruleConfig)
        handlers[rule as keyof Rules] = buildHandle(ruleConfig, algorithm, config) as InferRules<Rules>[keyof Rules]
    }
    return handlers
}
