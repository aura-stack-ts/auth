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
     * Atomically increments the counter at `key` and resets its TTL.
     * Returns the value *after* the increment.
     */
    increment(key: string, ttlMs: number): Promise<number>

    /**
     * Removes `key` from storage.
     */
    delete(key: string): Promise<void>
}

export interface RateLimitResult {
    /** Whether the request is allowed to proceed. */
    ok: boolean
    /** Configured maximum for this rule. */
    limit: number
    /** Requests / tokens remaining in the current window. */
    remaining: number
    /** Unix timestamp (ms) when the window / bucket resets. */
    resetAt: number
    /** Milliseconds to wait before retrying. */
    retryAfter: number
    /**
     * Returns a standard 429 Response with `RateLimit-*` headers pre-applied.
     * Use this as a zero-boilerplate rejection handler.
     *
     * @example
     * const result = await limiter.signIn.check(request)
     * if (!result.ok) return result.toResponse()
     */
    toResponse(): Response
}

export interface RateLimiterAlgorithm<RequestInit = Request> {
    peek(request: RequestInit): Promise<RateLimitResult>
    check(request: RequestInit): Promise<RateLimitResult>
}

export type AlgorithmType = "token-bucket"

interface BaseRule<RequestInit = Request> {
    algorithm: AlgorithmType
    /**
     * Derives the storage key from the incoming request.
     * Defaults to the endpoint name if omitted.
     *
     * @example (req) => `${req.ip}:${req.path}`
     */
    keyGenerator: (request: RequestInit) => string
}

export type TokenBucketRule<RequestInit = Request> = BaseRule<RequestInit> & {
    algorithm?: "token-bucket"
    /** Maximum token capacity (burst ceiling). */
    capacity: number
    /** Tokens added per millisecond. */
    refillRate: number
    /**
     * Optional storage instance specific to this rule.
     */
    storage?: RateLimiterStorage
}

export type FixedWindowRule<RequestInit = Request> = {
    algorithm: "fixed-window"
    /** Maximum requests allowed per window. */
    limit: number
    /** Window duration in milliseconds. Hard resets at each boundary. */
    windowMs: number
    /**
     * Optional storage instance specific to this rule.
     */
    storage?: RateLimiterStorage
} & Omit<BaseRule<RequestInit>, "algorithm">

export type RateLimiterRule<RequestInit = Request> = TokenBucketRule<RequestInit> | FixedWindowRule<RequestInit>

export interface RateLimiterConfig<Rules extends Record<string, RateLimiterRule>> {
    storage?: RateLimiterStorage
    /**
     * Per-endpoint rules, keyed by an arbitrary route/action name that you pass
     * to `rateLimiter.<endpoint>.<method>`.
     */
    rules: Rules
}

export interface RateLimiter<RequestInit = Request> {
    /**
     * Checks `key` against the rule registered for `endpoint`.
     * Returns the result and calls `onRejected` when the request is blocked.
     */
    check(request: RequestInit): Promise<RateLimitResult>
    /**
     * Resets the counter/bucket for `key` on the given `endpoint`.
     * Useful after a successful login to clear failed-attempt counters.
     */
    reset(request: RequestInit): Promise<void>
    /**
     * Returns the current state without mutating any counters.
     * Useful for surfacing limit headers on every response, not just limited ones.
     */
    peek(request: RequestInit): Promise<RateLimitResult>
}

export type InferRules<TRules extends Record<string, RateLimiterRule>> = {
    [K in keyof TRules]: TRules[K] extends RateLimiterRule<infer TRequest> ? RateLimiter<TRequest> : never
}
