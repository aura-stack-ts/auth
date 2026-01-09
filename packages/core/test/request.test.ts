import { fetchAsync } from "@/request.js"
import { describe, expect, test, vi } from "vitest"

describe("fetchAsync", () => {
    test("fetch resolved in timeout time", async () => {
        const mockFetch = vi.fn().mockResolvedValue("fetched response")
        vi.stubGlobal("fetch", mockFetch)

        const request = fetchAsync("https://example.com/timeout", {})
        await expect(request).resolves.toBe("fetched response")
        expect(mockFetch).toHaveBeenCalledOnce()
    })

    test("fetch aborted after timeout", async () => {
        vi.useFakeTimers()

        const mockFetch = vi.fn().mockImplementation((_, { signal }) => {
            return new Promise((_, reject) => {
                signal.addEventListener("abort", () => {
                    reject(new DOMException("Aborted Request", "AbortError"))
                })
            })
        })
        vi.stubGlobal("fetch", mockFetch)
        const request = fetchAsync("https://example.com/timeout", {}, 1000)
        vi.advanceTimersByTime(1050)

        await expect(request).rejects.toThrow("Aborted Request")
        expect(mockFetch).toHaveBeenCalledOnce()

        vi.useRealTimers()
    })

    test("fetch with abort is triggered at the correct timeout", async () => {
        vi.useFakeTimers()

        const abortSpy = vi.spyOn(AbortController.prototype, "abort")
        vi.stubGlobal("fetch", () => new Promise(() => {}))

        fetchAsync("https://example.com/timeout", {}, 2000)
        expect(abortSpy).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1999)
        expect(abortSpy).not.toHaveBeenCalled()

        vi.advanceTimersByTime(1)
        expect(abortSpy).toHaveBeenCalledOnce()

        vi.useRealTimers()
    })

    test("clears timeout after successful fetch", async () => {
        vi.useFakeTimers()

        const clearSpy = vi.spyOn(global, "clearTimeout")
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue("OK"))

        await fetchAsync("https://example.com/timeout", {}, 1000)

        expect(clearSpy).toHaveBeenCalledOnce()
        vi.useRealTimers()
    })

    test("propagates fetch error before timeout", async () => {
        vi.useFakeTimers()

        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network failure")))

        const promise = fetchAsync("https://example.com/timeout", {}, 200)

        vi.advanceTimersByTime(100)

        await expect(promise).rejects.toThrow("Network failure")
        vi.useRealTimers()
    })

    test("fetch resolving at timeout boundary succeeds", async () => {
        vi.useFakeTimers()

        vi.stubGlobal(
            "fetch",
            () =>
                new Promise((resolve) => {
                    setTimeout(() => resolve("OK"), 1000)
                })
        )

        const promise = fetchAsync("https://example.com/timeout", {}, 1000)

        vi.advanceTimersByTime(1000)

        await expect(promise).resolves.toBe("OK")
        vi.useRealTimers()
    })
})
