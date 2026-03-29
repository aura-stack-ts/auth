export interface StorageEntry {
    value: number
    expiresAt: number
}

/**
 * Pluggable storage backend. Implement this to use Redis, Cloudflare KV,
 * Deno KV, or any other store. An in-memory implementation is provided
 * out of the box via `MemoryStorage`.
 */
export interface RateLimiterStorage {
    /**
     * Returns the stored entry for `key`, or `null` if missing / expired.
     */
    get(key: string): Promise<StorageEntry | null>

    /**
     * Persists `entry` under `key` with the given TTL in milliseconds.
     */
    set(key: string, entry: StorageEntry, ttlMs: number): Promise<void>

    /**
     * Atomically increments the counter at `key` and sets its TTL if the key
     * does not yet exist. Returns the value *after* the increment.
     */
    increment(key: string, ttlMs: number): Promise<number>

    /**
     * Removes `key` from storage.
     */
    delete(key: string): Promise<void>
}

export interface RateLimitResult {
    /** Whether the request is allowed to proceed. */
    allowed: boolean
    /** Configured maximum for this rule. */
    limit: number
    /** Requests / tokens remaining in the current window. */
    remaining: number
    /** Unix timestamp (ms) when the window / bucket resets. */
    resetAt: number
    /** Only present when `allowed` is false. Milliseconds to wait before retrying. */
    retryAfter?: number
}

export interface RateLimiterAlgorithm {
    /**
     * Evaluates whether the request identified by `key` should be allowed.
     * Mutates storage as a side-effect (increments counters, drains tokens, …).
     */
    check(key: string, storage: RateLimiterStorage): Promise<RateLimitResult>

    peek(key: string, storage: RateLimiterStorage): Promise<RateLimitResult>
}

export type AlgorithmType = "token-bucket"

interface BaseRule {
    algorithm: AlgorithmType
    /**
     * Derives the storage key from the incoming request.
     * Defaults to the endpoint name if omitted.
     *
     * @example (req) => `${req.ip}:${req.path}`
     */
    keyGenerator?: (req: unknown) => string
}

export interface TokenBucketRule extends BaseRule {
    algorithm: "token-bucket"
    /** Maximum token capacity (burst ceiling). */
    capacity: number
    /** Tokens added per millisecond. */
    refillRatePerMs: number
}

export type RateLimiterRule = TokenBucketRule

export interface RateLimiterConfig {
    storage: RateLimiterStorage
    /**
     * Per-endpoint rules, keyed by an arbitrary route/action name that you pass
     * to `rateLimiter.check(endpoint, key)`.
     */
    rules: Record<string, RateLimiterRule>
    /**
     * Called when a request is rejected. Use this to return a framework-specific
     * response object (e.g. a `Response` in Web API environments, or set headers
     * in Express).
     */
    onRejected?: (result: RateLimitResult, endpoint: string) => unknown
}

export interface RateLimiter {
    /**
     * Checks `key` against the rule registered for `endpoint`.
     * Returns the result and calls `onRejected` when the request is blocked.
     */
    check(endpoint: string, key: string): Promise<RateLimitResult>
    /**
     * Resets the counter/bucket for `key` on the given `endpoint`.
     * Useful after a successful login to clear failed-attempt counters.
     */
    reset(endpoint: string, key: string): Promise<void>
    /**
     * Returns the current state without mutating any counters.
     * Useful for surfacing limit headers on every response, not just limited ones.
     */
    peek(endpoint: string, key: string): Promise<RateLimitResult>
}
