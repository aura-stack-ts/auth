import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createMemoryStorage } from "@/memory.ts"
import { createFixedWindowAlgorithm } from "@/algorithms/index.ts"

interface TestRequest {
    key: string
}

const request = (key: string): TestRequest => ({ key })

const createAlgorithm = (limit = 2, windowMs = 1000) => {
    return createFixedWindowAlgorithm<TestRequest>({
        algorithm: "fixed-window",
        limit,
        windowMs,
        storage: createMemoryStorage(),
        keyGenerator: (req) => req.key,
    })
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
})

afterEach(() => {
    vi.useRealTimers()
})

describe("FixedWindowAlgorithm", () => {
    test("allows requests up to limit and then blocks until window resets", async () => {
        const algorithm = createAlgorithm(2, 1000)
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
        expect(third.retryAfter).toBe(1000)
    })

    test("restores the allowance when the next window begins", async () => {
        const algorithm = createAlgorithm(2, 1000)
        const key = request("ip:2")

        await algorithm.check(key)
        await algorithm.check(key)

        vi.advanceTimersByTime(1000)

        const afterReset = await algorithm.check(key)

        expect(afterReset.ok).toBe(true)
        expect(afterReset.remaining).toBe(1)
        expect(afterReset.resetAt).toBe(2000)
        expect(afterReset.retryAfter).toBe(0)
    })

    test("peek reports the current window without consuming a request", async () => {
        const algorithm = createAlgorithm(3, 1000)
        const key = request("ip:3")

        const consumed = await algorithm.check(key)
        const preview = await algorithm.peek(key)
        const next = await algorithm.check(key)

        expect(consumed.ok).toBe(true)
        expect(consumed.remaining).toBe(2)

        expect(preview.ok).toBe(true)
        expect(preview.remaining).toBe(2)
        expect(preview.resetAt).toBe(1000)
        expect(preview.retryAfter).toBe(0)

        expect(next.ok).toBe(true)
        expect(next.remaining).toBe(1)
    })

    test("keeps counters isolated per key", async () => {
        const algorithm = createAlgorithm(1, 1000)
        const keyA = request("ip:A")
        const keyB = request("ip:B")

        const firstA = await algorithm.check(keyA)
        const secondA = await algorithm.check(keyA)
        const firstB = await algorithm.check(keyB)

        expect(firstA.ok).toBe(true)
        expect(secondA.ok).toBe(false)
        expect(firstB.ok).toBe(true)
    })

    test("applies the next window boundary at exact rollover time", async () => {
        const algorithm = createAlgorithm(1, 1000)
        const key = request("ip:4")

        const first = await algorithm.check(key)

        vi.advanceTimersByTime(1000)

        const second = await algorithm.check(key)

        expect(first.ok).toBe(true)
        expect(first.resetAt).toBe(1000)

        expect(second.ok).toBe(true)
        expect(second.remaining).toBe(0)
        expect(second.resetAt).toBe(2000)
    })
})
