import { createTokenBucketAlgorithm } from "@/algorithms/token-bucket"
import type { RateLimiter, RateLimiterAlgorithm, RateLimiterConfig, RateLimitResult } from "@/types"

/**
 * Builds the algorithm instance for a rule, memoized per endpoint name.
 */
function buildAlgorithm(rule: RateLimiterConfig["rules"][string]): RateLimiterAlgorithm {
    switch (rule.algorithm) {
        case "token-bucket":
            return createTokenBucketAlgorithm(rule)
        default: {
            throw new Error(`Unknown algorithm:`)
        }
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
export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
    const { storage, rules, onRejected } = config

    const algorithms = new Map<string, RateLimiterAlgorithm>()

    for (const [endpoint, rule] of Object.entries(rules)) {
        algorithms.set(endpoint, buildAlgorithm(rule))
    }

    function getAlgorithm(endpoint: string): RateLimiterAlgorithm {
        const algorithm = algorithms.get(endpoint)
        if (!algorithm) {
            throw new Error(
                `[rate-limiter] No rule configured for endpoint "${endpoint}". ` +
                    `Known endpoints: ${[...algorithms.keys()].join(", ")}`
            )
        }
        return algorithm
    }

    async function check(endpoint: string, key: string): Promise<RateLimitResult> {
        const algorithm = getAlgorithm(endpoint)
        const result = await algorithm.check(key, storage)

        if (!result.allowed) {
            onRejected?.(result, endpoint)
        }

        return result
    }

    async function reset(endpoint: string, key: string): Promise<void> {
        const rule = rules[endpoint]
        if (!rule) {
            throw new Error(`[rate-limiter] No rule configured for endpoint "${endpoint}".`)
        }
        if (rule.algorithm === "token-bucket") {
            await Promise.all([storage.delete(`${key}:tb:tokens`), storage.delete(`${key}:tb:lastRefill`)])
        }
    }

    async function peek(endpoint: string, key: string): Promise<RateLimitResult> {
        const algorithm = getAlgorithm(endpoint)
        if (algorithm.peek) {
            return algorithm.peek(key, storage)
        }
        return algorithm.check(key, storage)
    }

    return { check, reset, peek }
}
