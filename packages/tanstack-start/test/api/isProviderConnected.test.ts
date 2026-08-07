import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "@test/api/test-utils"
import { isProviderConnected } from "@/lib/api"

beforeEachSetup()

describe("isProviderConnected", () => {
    test("returns success: false and connected: false when the API reports failure", async () => {
        const auth = authInstance({
            isProviderConnected: vi.fn().mockResolvedValue({
                success: false,
                connected: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({ success: false, connected: false })
    })

    test("returns success: true and connected: true when the API reports connected", async () => {
        const auth = authInstance({
            isProviderConnected: vi.fn().mockResolvedValue({
                success: true,
                connected: true,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({ success: true, connected: true })
    })

    test("returns success: true and connected: false when the API reports not connected", async () => {
        const auth = authInstance({
            isProviderConnected: vi.fn().mockResolvedValue({
                success: true,
                connected: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({ success: true, connected: false })
    })

    test("calls isProviderConnected with oauth provider extracted from options", async () => {
        const isProviderConnectedAPI = vi.fn().mockResolvedValue({
            success: true,
            connected: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            isProviderConnected: isProviderConnectedAPI,
        })

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(isProviderConnectedAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls isProviderConnected with headers from getRequestHeaders", async () => {
        const isProviderConnectedAPI = vi.fn().mockResolvedValue({
            success: true,
            connected: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            isProviderConnected: isProviderConnectedAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(isProviderConnectedAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const isProviderConnectedAPI = vi.fn().mockResolvedValue({
            success: true,
            connected: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            isProviderConnected: isProviderConnectedAPI,
        })

        const isProviderConnectedFn = isProviderConnected(auth)
        const handler = isProviderConnectedFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "GET" })
        expect(isProviderConnectedAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers), someOption: "value" })
    })
})
