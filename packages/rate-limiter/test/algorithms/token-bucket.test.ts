import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createMemoryStorage } from "@/memory.ts"
import { createRateLimiter } from "@/rate-limiter.ts"
import { createTokenBucketAlgorithm } from "@/algorithms/index.ts"

interface TestRequest {
    key: string
}

interface SessionContext {
    clientId: string
}

const request = (key: string): TestRequest => ({ key })
const httpRequest = (key: string): Request => new Request("https://example.test/login", { headers: { "x-forwarded-for": key } })

const createAlgorithm = (capacity = 2, refillRate = 0.01) => {
    return createTokenBucketAlgorithm<TestRequest>({
        algorithm: "token-bucket",
        capacity,
        refillRate,
        storage: createMemoryStorage(),
        keyGenerator: (req) => req.key,
    })
}

const createAlgorithmWithContext = (capacity = 4, refillRate = 1 / 1_000_000) => {
    return createTokenBucketAlgorithm<TestRequest, SessionContext>({
        algorithm: "token-bucket",
        capacity,
        refillRate,
        storage: createMemoryStorage(),
        keyGenerator: (req, ctx) => `tb:${ctx.clientId}:${req.key}`,
    })
}

describe("TokenBucketAlgorithm", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    test("allows requests up to capacity and then blocks", async () => {
        const algorithm = createAlgorithm(2, 0.01)
        const key = request("ip:1")

        const first = await algorithm.check(key)
        const second = await algorithm.check(key)
        const third = await algorithm.check(key)

        expect(first.ok).toBe(true)
        expect(first.remaining).toBe(1)

        expect(second.ok).toBe(true)
        expect(second.remaining).toBe(0)

        expect(third.ok).toBe(false)
        expect(third.remaining).toBe(0)
        expect(third.retryAfter).toBe(100)
    })

    test("refills tokens over time based on refillRate", async () => {
        const algorithm = createAlgorithm(2, 0.01)
        const key = request("ip:2")

        await algorithm.check(key)
        await algorithm.check(key)

        vi.advanceTimersByTime(100)
        const after100ms = await algorithm.check(key)
        expect(after100ms.ok).toBe(true)
        expect(after100ms.remaining).toBe(0)

        vi.advanceTimersByTime(200)
        const after300ms = await algorithm.check(key)
        expect(after300ms.ok).toBe(true)
        expect(after300ms.remaining).toBe(1)
    })

    test("peek reports current state without consuming a token", async () => {
        const algorithm = createAlgorithm(3, 0.01)
        const key = request("ip:3")

        const consumed = await algorithm.check(key)
        expect(consumed.remaining).toBe(2)

        const preview = await algorithm.peek(key)
        expect(preview.ok).toBe(true)
        expect(preview.remaining).toBe(2)

        const next = await algorithm.check(key)
        expect(next.ok).toBe(true)
        expect(next.remaining).toBe(1)
    })

    test("keeps independent buckets per key", async () => {
        const algorithm = createAlgorithm(1, 0.01)
        const keyA = request("ip:A")
        const keyB = request("ip:B")

        const firstA = await algorithm.check(keyA)
        const secondA = await algorithm.check(keyA)
        const firstB = await algorithm.check(keyB)

        expect(firstA.ok).toBe(true)
        expect(secondA.ok).toBe(false)
        expect(firstB.ok).toBe(true)
    })
})

describe("TokenBucketAlgorithm with context", () => {
    const capacity = 4
    const refillRate = 1 / 1_000_000

    test("different sessions have independent buckets", async () => {
        const limiter = createAlgorithmWithContext(capacity, refillRate)
        const req = request("ip:1")

        const ctxA: SessionContext = { clientId: "clientA" }
        const ctxB: SessionContext = { clientId: "clientB" } as any

        for (let i = 0; i < capacity; i++) await limiter.check(req, ctxA)
        const aBlocked = await limiter.check(req, ctxA)

        const bAllowed = await limiter.check(req, ctxB)

        expect(aBlocked.ok).toBe(false)
        expect(bAllowed.ok).toBe(true)
    })

    test("same user, same session shares a bucket", async () => {
        const limiter = createAlgorithmWithContext(capacity, refillRate)
        const req = request("ip:1")
        const ctx: SessionContext = { clientId: "clientC" }

        const r1 = await limiter.check(req, ctx)
        const r2 = await limiter.check(req, ctx)

        expect(r1.remaining).toBe(3)
        expect(r2.remaining).toBe(2)
    })

    test("peek with context reads without draining", async () => {
        const limiter = createAlgorithmWithContext(capacity, refillRate)
        const req = request("ip:1")
        const ctx: SessionContext = { clientId: "u3" }

        await limiter.peek(req, ctx)
        await limiter.peek(req, ctx)

        const after = await limiter.check(req, ctx)
        expect(after.remaining).toBe(capacity - 1)
    })

    test("reset with context replenishes only that session", async () => {
        const limiter = createAlgorithmWithContext(capacity, refillRate)
        const req = request("ip:1")
        const ctxA: SessionContext = { clientId: "u4" }
        const ctxB: SessionContext = { clientId: "u5" }

        for (let i = 0; i < capacity; i++) await limiter.check(req, ctxA)
        expect((await limiter.check(req, ctxA)).ok).toBe(false)

        await limiter.reset(req, ctxA)
        expect((await limiter.check(req, ctxA)).ok).toBe(true)

        const bResult = await limiter.check(req, ctxB)
        expect(bResult.ok).toBe(true)
        expect(bResult.remaining).toBe(capacity - 1)
    })

    test("async keyGenerator resolves correctly with context", async () => {
        const storage = createMemoryStorage()
        const limiter = createTokenBucketAlgorithm<TestRequest, SessionContext>({
            algorithm: "token-bucket",
            capacity: 2,
            refillRate,
            storage,
            keyGenerator: async (_req, { clientId }) => {
                await Promise.resolve()
                return `tb:${clientId}`
            },
        })

        const ctx: SessionContext = { clientId: "u5" }
        const r1 = await limiter.check(request("ip:1"), ctx)
        const r2 = await limiter.check(request("ip:1"), ctx)
        const r3 = await limiter.check(request("ip:1"), ctx)

        expect(r1.ok).toBe(true)
        expect(r2.ok).toBe(true)
        expect(r3.ok).toBe(false)
    })
})

describe("createRateLimiter", () => {
    test("builds endpoint handlers that enforce independent limits", async () => {
        const authStorage = createMemoryStorage()
        const apiStorage = createMemoryStorage()

        const limiter = createRateLimiter({
            rules: {
                signIn: {
                    algorithm: "token-bucket",
                    capacity: 1,
                    refillRate: 0.01,
                    storage: authStorage,
                    keyGenerator: (req: Request) => req.headers.get("x-forwarded-for") ?? "unknown",
                },
                api: {
                    algorithm: "token-bucket",
                    capacity: 2,
                    refillRate: 0.01,
                    storage: apiStorage,
                    keyGenerator: (req: Request) => req.headers.get("x-forwarded-for") ?? "unknown",
                },
            },
        })

        const key = httpRequest("user:1")

        const signInFirst = await limiter.signIn.check(key)
        const signInSecond = await limiter.signIn.check(key)
        const apiFirst = await limiter.api.check(key)
        const apiSecond = await limiter.api.check(key)

        expect(signInFirst.ok).toBe(true)
        expect(signInSecond.ok).toBe(false)
        expect(apiFirst.ok).toBe(true)
        expect(apiSecond.ok).toBe(true)
    })

    test("uses keyGenerator and keeps buckets isolated per request key", async () => {
        const storage = createMemoryStorage()
        const limiter = createRateLimiter({
            rules: {
                signIn: {
                    algorithm: "token-bucket",
                    capacity: 1,
                    refillRate: 0.01,
                    storage,
                    keyGenerator: (req: Request) => req.headers.get("x-forwarded-for") ?? "unknown",
                },
            },
        })

        const keyA = httpRequest("ip:A")
        const keyB = httpRequest("ip:B")

        const firstA = await limiter.signIn.check(keyA)
        const secondA = await limiter.signIn.check(keyA)
        const firstB = await limiter.signIn.check(keyB)

        expect(firstA.ok).toBe(true)
        expect(secondA.ok).toBe(false)
        expect(firstB.ok).toBe(true)
    })

    test("exposes peek without consuming and reset to clear a key bucket", async () => {
        const storage = createMemoryStorage()
        const limiter = createRateLimiter({
            storage,
            rules: {
                signIn: {
                    algorithm: "token-bucket",
                    capacity: 2,
                    refillRate: 0.01,
                    storage,
                    keyGenerator: (req: Request) => req.headers.get("x-forwarded-for") ?? "unknown",
                },
            },
        })

        const key = httpRequest("user:reset")

        const first = await limiter.signIn.check(key)
        expect(first.remaining).toBe(1)

        const preview = await limiter.signIn.peek(key)
        expect(preview.ok).toBe(true)
        expect(preview.remaining).toBe(1)

        const second = await limiter.signIn.check(key)
        expect(second.ok).toBe(true)
        expect(second.remaining).toBe(0)

        await limiter.signIn.reset(key)

        const afterReset = await limiter.signIn.check(key)
        expect(afterReset.ok).toBe(true)
        expect(afterReset.remaining).toBe(1)
    })
})
