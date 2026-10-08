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
                keyGenerator: () => "user",
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
