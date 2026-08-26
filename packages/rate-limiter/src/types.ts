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

export interface RateLimiterAlgorithm<RequestInit = Request, Context = never> {
    peek: [Context] extends [never]
        ? (request: RequestInit) => RateLimitResult | Promise<RateLimitResult>
        : (request: RequestInit, context: Context) => RateLimitResult | Promise<RateLimitResult>
    check: [Context] extends [never]
        ? (request: RequestInit) => RateLimitResult | Promise<RateLimitResult>
        : (request: RequestInit, context: Context) => RateLimitResult | Promise<RateLimitResult>
    reset: [Context] extends [never]
        ? (request: RequestInit) => Promise<void>
        : (request: RequestInit, context: Context) => Promise<void>
}
export type AlgorithmType = "token-bucket" | "fixed-window" | "leaky-bucket" | "sliding-window"

export type KeyGenerator<RequestInit = Request, Context = never> = [Context] extends [never]
    ? (request: RequestInit) => string | Promise<string>
    : (request: RequestInit, context: Context) => string | Promise<string>

interface BaseRule<RequestInit = Request, Context = never> {
    algorithm: AlgorithmType
    /**
     * Derives the storage key from the incoming request.
     * Defaults to the endpoint name if omitted.
     *
     * @example (req) => `${req.ip}:${req.path}`
     */
    keyGenerator: KeyGenerator<RequestInit, Context>

    /**
     * Optional storage instance specific to this rule.
     */
    storage?: RateLimiterStorage
}

export type TokenBucketRule<RequestInit = Request, Context = never> = BaseRule<RequestInit, Context> & {
    algorithm?: "token-bucket"
    /** Maximum token capacity (burst ceiling). */
    capacity: number
    /** Tokens added per millisecond. */
    refillRate: number
}

export interface FixedWindowRule<RequestInit = Request, Context = never> extends BaseRule<RequestInit, Context> {
    algorithm: "fixed-window"
    /** Maximum requests allowed per window. */
    limit: number
    /** Window duration in milliseconds. Hard resets at each boundary. */
    windowMs: number
}

export interface LeakyBucketRule<RequestInit = Request, Context = never> extends BaseRule<RequestInit, Context> {
    algorithm: "leaky-bucket"
    /**
     * The maximum queue size (burst capacity). When the bucket is full,
     * additional requests are rejected until space is available.
     */
    capacity: number
    /**
     * The rate at which the bucket leaks (processes requests) in tokens per
     * millisecond. This controls how quickly the bucket can empty and accept
     * new requests after reaching capacity.
     */
    leakRatePerMs: number
}

export interface SlidingWindowRule<RequestInit = Request, Context = never> extends BaseRule<RequestInit, Context> {
    algorithm: "sliding-window"
    /** Maximum requests allowed per window. */
    limit: number
    /** Window duration in milliseconds. */
    windowMs: number
}

export type RateLimiterRule<RequestInit = Request, Context = never> =
    | TokenBucketRule<RequestInit, Context>
    | FixedWindowRule<RequestInit, Context>
    | LeakyBucketRule<RequestInit, Context>
    | SlidingWindowRule<RequestInit, Context>

export interface RateLimiterConfig<Rules extends Record<string, RateLimiterRule<any, any>>> {
    storage?: RateLimiterStorage
    /**
     * Per-endpoint rules, keyed by an arbitrary route/action name that you pass
     * to `rateLimiter.<endpoint>.<method>`.
     */
    rules: Rules
}

export interface RateLimiter<RequestInit = Request, Context = never> {
    /**
     * Checks `key` against the rule registered for `endpoint`.
     * Returns the result and calls `onRejected` when the request is blocked.
     */
    check: [Context] extends [never]
        ? (request: RequestInit) => Promise<RateLimitResult>
        : (request: RequestInit, context: Context) => Promise<RateLimitResult>
    /**
     * Resets the counter/bucket for `key` on the given `endpoint`.
     * Useful after a successful login to clear failed-attempt counters.
     */
    reset: [Context] extends [never]
        ? (request: RequestInit) => Promise<void>
        : (request: RequestInit, context: Context) => Promise<void>
    /**
     * Returns the current state without mutating any counters.
     * Useful for surfacing limit headers on every response, not just limited ones.
     */
    peek: [Context] extends [never]
        ? (request: RequestInit) => Promise<RateLimitResult>
        : (request: RequestInit, context: Context) => Promise<RateLimitResult>
}

export type InferContext<T extends RateLimiterRule<any, any>> = T["keyGenerator"] extends (request: any) => any
    ? never
    : T["keyGenerator"] extends (request: any, context: infer C) => any
      ? C
      : never

export type InferRules<TRules extends Record<string, RateLimiterRule<any, any>>> = {
    [K in keyof TRules]: TRules[K] extends RateLimiterRule<infer TRequest, any>
        ? RateLimiter<TRequest, InferContext<TRules[K]>>
        : never
}
