import { createMemoryStorage } from "@/memory.ts"
import {
    createTokenBucketAlgorithm,
    createFixedWindowAlgorithm,
    createLeakyBucketAlgorithm,
    createSlidingWindowAlgorithm,
} from "@/algorithms/index.ts"
import type { InferRules, RateLimiterConfig, RateLimiterRule } from "@/types.ts"

/**
 * Builds the algorithm instance for a rule, memoized per endpoint name.
 */
const buildAlgorithm = <RequestInit = Request, Context = never>(
    rule: RateLimiterRule<RequestInit, Context>
): InferRules<Record<string, typeof rule>>[string] => {
    rule.algorithm ||= "token-bucket"
    switch (rule.algorithm) {
        case "token-bucket":
            return createTokenBucketAlgorithm(rule) as InferRules<Record<string, typeof rule>>[string]
        case "fixed-window":
            return createFixedWindowAlgorithm(rule) as InferRules<Record<string, typeof rule>>[string]
        case "leaky-bucket":
            return createLeakyBucketAlgorithm(rule) as InferRules<Record<string, typeof rule>>[string]
        case "sliding-window":
            return createSlidingWindowAlgorithm(rule) as InferRules<Record<string, typeof rule>>[string]
        default:
            throw new Error(`[rate-limiter] Unknown algorithm: "${String((rule as { algorithm?: string }).algorithm)}"`)
    }
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
export const createRateLimiter = <
    Rules extends Record<string, RateLimiterRule<any, any>> = Record<string, RateLimiterRule<any, any>>,
>(
    config: RateLimiterConfig<Rules>
): InferRules<Rules> => {
    const globalStorage = config.storage ?? createMemoryStorage()
    const handlers = {} as InferRules<Rules>
    for (const [name, rule] of Object.entries(config.rules)) {
        const algorithm = buildAlgorithm(rule) as InferRules<Rules>[keyof Rules]
        rule.storage ??= globalStorage
        handlers[name as keyof Rules] = algorithm
    }
    return handlers
}
