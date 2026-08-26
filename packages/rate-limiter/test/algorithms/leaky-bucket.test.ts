import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createMemoryStorage } from "@/memory.ts"
import { createLeakyBucketAlgorithm } from "@/algorithms/index.ts"

interface TestRequest {
    key: string
}

interface SessionContext {
    clientId: string
}

const request = (key: string): TestRequest => ({ key })

const createAlgorithm = (capacity = 2, leakRatePerMs = 1) => {
    return createLeakyBucketAlgorithm<TestRequest>({
        algorithm: "leaky-bucket",
        capacity,
        leakRatePerMs,
        storage: createMemoryStorage(),
        keyGenerator: (req) => req.key,
    })
}

const createAlgorithmWithContext = (capacity = 2, leakRatePerMs = 1) => {
    return createLeakyBucketAlgorithm<TestRequest, SessionContext>({
        algorithm: "leaky-bucket",
        capacity,
        leakRatePerMs,
        storage: createMemoryStorage(),
        keyGenerator: (req, ctx) => `lb:${req.key}:${ctx.clientId}`,
    })
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
})

afterEach(() => {
    vi.useRealTimers()
})

describe("LeakyBucketAlgorithm", () => {
    test("allows requests up to capacity and then blocks", async () => {
        const algorithm = createAlgorithm(2, 1)
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
        expect(third.retryAfter).toBe(1)
    })

    test("drains over time and accepts new requests as capacity frees up", async () => {
        const algorithm = createAlgorithm(2, 1)
        const key = request("ip:2")

        await algorithm.check(key)
        await algorithm.check(key)

        vi.advanceTimersByTime(1)

        const afterOneMs = await algorithm.check(key)

        expect(afterOneMs.ok).toBe(true)
        expect(afterOneMs.remaining).toBe(0)
        expect(afterOneMs.resetAt).toBe(3)
    })

    test("rejected requests do not increase the stored level", async () => {
        const algorithm = createAlgorithm(1, 0.5)
        const key = request("ip:3")

        const first = await algorithm.check(key)
        const second = await algorithm.check(key)

        vi.advanceTimersByTime(2)

        const afterDrain = await algorithm.check(key)

        expect(first.ok).toBe(true)
        expect(second.ok).toBe(false)
        expect(second.remaining).toBe(0)
        expect(second.retryAfter).toBe(2)
        expect(afterDrain.ok).toBe(true)
        expect(afterDrain.remaining).toBe(0)
    })

    test("peek reports state without consuming a queued slot", async () => {
        const algorithm = createAlgorithm(3, 1)
        const key = request("ip:4")

        const consumed = await algorithm.check(key)
        const preview = await algorithm.peek(key)
        const next = await algorithm.check(key)

        expect(consumed.ok).toBe(true)
        expect(consumed.remaining).toBe(2)

        expect(preview.ok).toBe(true)
        expect(preview.remaining).toBe(1)
        expect(preview.resetAt).toBe(2)
        expect(preview.retryAfter).toBe(1)

        expect(next.ok).toBe(true)
        expect(next.remaining).toBe(1)
    })

    test("keeps bucket state isolated per key", async () => {
        const algorithm = createAlgorithm(1, 1)
        const keyA = request("ip:A")
        const keyB = request("ip:B")

        const firstA = await algorithm.check(keyA)
        const secondA = await algorithm.check(keyA)
        const firstB = await algorithm.check(keyB)

        expect(firstA.ok).toBe(true)
        expect(secondA.ok).toBe(false)
        expect(firstB.ok).toBe(true)
    })

    test("falls back to a fresh bucket after storage entries expire", async () => {
        const algorithm = createAlgorithm(2, 1)
        const key = request("ip:5")

        await algorithm.check(key)
        await algorithm.check(key)

        vi.advanceTimersByTime(5000)

        const afterExpiry = await algorithm.check(key)

        expect(afterExpiry.ok).toBe(true)
        expect(afterExpiry.remaining).toBe(1)
        expect(afterExpiry.resetAt).toBe(5001)
    })
})

describe("LeakyBucketAlgorithm with context", () => {
    const capacity = 3
    const leakRatePerMs = 1 / 1_000_000

    test("different users have independent buckets", async () => {
        const limiter = createAlgorithmWithContext(capacity, leakRatePerMs)
        const req = request("ip")

        for (let i = 0; i < capacity; i++) await limiter.check(req, { clientId: "alice" })
        const aliceBlocked = await limiter.check(req, { clientId: "alice" })

        const bobAllowed = await limiter.check(req, { clientId: "bob" })

        expect(aliceBlocked.ok).toBe(false)
        expect(bobAllowed.ok).toBe(true)
    })

    test("rejected requests do not raise level for context-keyed bucket", async () => {
        const limiter = createAlgorithmWithContext(capacity, leakRatePerMs)
        const req = request("ip:1")
        const ctx: SessionContext = { clientId: "carol" }

        for (let i = 0; i < capacity; i++) await limiter.check(req, ctx)

        for (let i = 0; i < 5; i++) {
            const result = await limiter.check(req, ctx)
            expect(result.ok).toBe(false)
            expect(result.remaining).toBe(0)
        }
    })

    test("peek with context does not fill the bucket", async () => {
        const limiter = createAlgorithmWithContext(capacity, leakRatePerMs)
        const req = request("ip:1")
        const ctx: SessionContext = { clientId: "dave" }

        await limiter.peek(req, ctx)
        await limiter.peek(req, ctx)

        const r1 = await limiter.check(req, ctx)
        expect(r1.ok).toBe(true)
        expect(r1.remaining).toBe(capacity - 1)
    })

    test("reset with context drains only that user's bucket", async () => {
        const limiter = createAlgorithmWithContext(capacity, leakRatePerMs)
        const req = request("ip:1")

        for (let i = 0; i < capacity; i++) await limiter.check(req, { clientId: "eve" })
        expect((await limiter.check(req, { clientId: "eve" })).ok).toBe(false)

        await limiter.reset(req, { clientId: "eve" })
        expect((await limiter.check(req, { clientId: "eve" })).ok).toBe(true)

        const frankResult = await limiter.check(req, { clientId: "frank" })
        expect(frankResult.ok).toBe(true)
    })

    test("retryAfter reflects leak rate when blocked", async () => {
        const storage = createMemoryStorage()
        const leakRatePerMsKnown = 1 / 200
        const limiter = createLeakyBucketAlgorithm<TestRequest, SessionContext>({
            algorithm: "leaky-bucket",
            capacity: 1,
            leakRatePerMs: leakRatePerMsKnown,
            storage,
            keyGenerator: (_req, { clientId }) => `lb:retry:${clientId}`,
        })

        await limiter.check(request("ip:1"), { clientId: "grace" })
        const blocked = await limiter.check(request("ip:1"), { clientId: "grace" })

        expect(blocked.ok).toBe(false)
        expect(blocked.retryAfter).toBe(Math.ceil(1 / leakRatePerMsKnown))
    })
})
