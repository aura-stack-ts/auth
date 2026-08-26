import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createMemoryStorage } from "@/memory.ts"
import { createSlidingWindowAlgorithm } from "@/algorithms/sliding-window.ts"

describe("createSlidingWindowAlgorithm", () => {
    const limit = 10
    const windowMs = 1_000

    let storage: ReturnType<typeof createMemoryStorage>

    beforeEach(() => {
        storage = createMemoryStorage()

        vi.useFakeTimers()
        vi.setSystemTime(0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const request = new Request("https://example.com/api/auth/sign-in")

    describe("peek", () => {
        test("returns full capacity before any requests", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: (_) => "user",
            })

            const result = await limiter.peek(request)

            expect(result).toMatchObject({
                ok: true,
                limit,
                remaining: limit,
                retryAfter: 0,
            })

            expect(result.resetAt).toBe(windowMs)
        })

        test("does not consume capacity", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            await limiter.peek(request)
            await limiter.peek(request)
            await limiter.peek(request)

            const result = await limiter.peek(request)

            expect(result.remaining).toBe(limit)
            expect(result.ok).toBe(true)
        })

        test("returns remaining capacity after requests", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 5,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            await limiter.check(request)

            const result = await limiter.peek(request)

            expect(result.remaining).toBe(4)
        })

        test("carries part of the previous window into the current one", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            for (let index = 0; index < limit; index++) {
                await limiter.check(request)
            }

            vi.setSystemTime(1_500)

            const result = await limiter.peek(request)

            expect(result.ok).toBe(true)
            expect(result.remaining).toBe(5)
        })

        test("fully expires previous traffic after two windows", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            for (let index = 0; index < limit; index++) {
                await limiter.check(request)
            }

            vi.setSystemTime(2_000)

            const result = await limiter.peek(request)

            expect(result.ok).toBe(true)
            expect(result.remaining).toBe(limit)
        })

        test("combines previous and current window counts", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            for (let index = 0; index < limit; index++) {
                await limiter.check(request)
            }

            vi.setSystemTime(1_500)

            await limiter.check(request)
            await limiter.check(request)

            const result = await limiter.peek(request)

            expect(result.ok).toBe(true)
            expect(result.remaining).toBe(3)
        })

        test("tracks each key independently", async () => {
            const limiter = createSlidingWindowAlgorithm<{ ip: string }>({
                algorithm: "sliding-window",
                limit: 5,
                windowMs,
                storage,
                keyGenerator: (request) => request.ip,
            })

            await limiter.check({ ip: "1" })

            const first = await limiter.peek({ ip: "1" })
            const second = await limiter.peek({ ip: "2" })

            expect(first.remaining).toBe(4)
            expect(second.remaining).toBe(5)
        })

        test("handles requests exactly at a window boundary", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            await limiter.check(request)

            vi.setSystemTime(windowMs)

            const result = await limiter.peek(request)

            expect(result.ok).toBe(true)
            expect(result.remaining).toBe(9)
        })
    })

    describe("check", () => {
        test("allows requests below the limit", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 3,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            const first = await limiter.check(request)
            const second = await limiter.check(request)
            const third = await limiter.check(request)

            expect(first.ok).toBe(true)
            expect(second.ok).toBe(true)
            expect(third.ok).toBe(true)

            expect(third.remaining).toBe(0)
        })

        test("blocks requests after reaching the limit", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 2,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            await limiter.check(request)
            await limiter.check(request)

            const result = await limiter.check(request)

            expect(result.ok).toBe(false)
            expect(result.remaining).toBe(0)
            expect(result.retryAfter).toBe(windowMs)
        })

        test("returns retryAfter until the current window boundary", async () => {
            vi.setSystemTime(250)

            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 1,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            await limiter.check(request)

            const result = await limiter.check(request)

            expect(result.ok).toBe(false)
            expect(result.retryAfter).toBe(750)
        })

        test("counts requests from the current window immediately", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 3,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            const first = await limiter.check(request)
            const second = await limiter.check(request)
            const third = await limiter.check(request)

            expect(first.remaining).toBe(2)
            expect(second.remaining).toBe(1)
            expect(third.remaining).toBe(0)
        })

        test("blocks when the interpolated estimate exceeds the limit", async () => {
            const limiter = createSlidingWindowAlgorithm({
                algorithm: "sliding-window",
                limit: 10,
                windowMs,
                storage,
                keyGenerator: () => "user",
            })

            for (let index = 0; index < 10; index++) {
                await limiter.check(request)
            }

            vi.setSystemTime(1_100)

            const first = await limiter.check(request)
            const second = await limiter.check(request)

            expect(first.remaining).toBe(0)
            expect(second.remaining).toBe(0)
            expect(second.ok).toBe(false)
        })
    })
})

describe("createSlidingWindowAlgorithm with context", () => {
    const limit = 4
    const windowMs = 15_000

    interface TestRequest {
        key: string
    }

    const request = (key: string): TestRequest => ({ key })

    const createAlgorithm = () => {
        return createSlidingWindowAlgorithm<TestRequest, { clientId: string }>({
            algorithm: "sliding-window",
            limit,
            windowMs,
            storage: createMemoryStorage(),
            keyGenerator: (_req, { clientId }) => `sw:account:${clientId}`,
        })
    }

    test("different users have independent counters", async () => {
        const limiter = createAlgorithm()
        const req = request("ip:1")

        for (let i = 0; i < limit; i++) await limiter.check(req, { clientId: "alice" })
        const aliceBlocked = await limiter.check(req, { clientId: "alice" })

        const bobResult = await limiter.check(req, { clientId: "bob" })

        expect(aliceBlocked.ok).toBe(false)
        expect(bobResult.ok).toBe(true)
    })

    test("peek with context does not consume quota", async () => {
        const limiter = createAlgorithm()
        const req = request("ip:1")

        await limiter.peek(req, { clientId: "carol" })
        await limiter.peek(req, { clientId: "carol" })

        const after = await limiter.check(req, { clientId: "carol" })
        expect(after.remaining).toBe(limit - 1)
    })

    test("reset with context only clears that user", async () => {
        const limiter = createAlgorithm()
        const req = request("ip:1")

        for (let i = 0; i < limit; i++) await limiter.check(req, { clientId: "dave" })
        expect((await limiter.check(req, { clientId: "dave" })).ok).toBe(false)

        await limiter.reset(req, { clientId: "dave" })
        expect((await limiter.check(req, { clientId: "dave" })).ok).toBe(true)

        expect((await limiter.check(req, { clientId: "eve" })).ok).toBe(true)
    })

    test("retryAfter is 0 when ok, positive when blocked", async () => {
        const limiter = createAlgorithm()
        const req = request("ip:1")

        const ok = await limiter.check(req, { clientId: "frank" })
        expect(ok.retryAfter).toBe(0)

        for (let i = 1; i < limit; i++) await limiter.check(req, { clientId: "frank" })
        const blocked = await limiter.check(req, { clientId: "frank" })
        expect(blocked.retryAfter).toBeGreaterThan(0)
    })
})
