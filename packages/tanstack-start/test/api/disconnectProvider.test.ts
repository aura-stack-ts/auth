import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "@test/api/test-utils"
// don't change the import order.
import { disconnectProvider } from "@/lib/api"

beforeEachSetup()

describe("disconnectProvider", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = authInstance({
            disconnectProvider: vi.fn().mockResolvedValue({
                success: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const disconnectProviderFn = disconnectProvider(auth)
        const handler = disconnectProviderFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({ success: false })
    })

    test("returns success: true when the API reports success", async () => {
        const auth = authInstance({
            disconnectProvider: vi.fn().mockResolvedValue({
                success: true,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const disconnectProviderFn = disconnectProvider(auth)
        const handler = disconnectProviderFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({ success: true })
    })

    test("calls disconnectProvider with oauth provider extracted from options", async () => {
        const disconnectProviderAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            disconnectProvider: disconnectProviderAPI,
        })

        const disconnectProviderFn = disconnectProvider(auth)
        const handler = disconnectProviderFn.__executeServer
        await handler({ data: { oauth: "github" }, method: "POST" })

        expect(disconnectProviderAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls disconnectProvider with headers from getRequestHeaders", async () => {
        const disconnectProviderAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            disconnectProvider: disconnectProviderAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const disconnectProviderFn = disconnectProvider(auth)
        const handler = disconnectProviderFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "POST" })
        expect(disconnectProviderAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const disconnectProviderAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            disconnectProvider: disconnectProviderAPI,
        })

        const disconnectProviderFn = disconnectProvider(auth)
        const handler = disconnectProviderFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "POST" })
        expect(disconnectProviderAPI).toHaveBeenCalledWith("github", { someOption: "value", headers: expect.any(Headers) })
    })
})
