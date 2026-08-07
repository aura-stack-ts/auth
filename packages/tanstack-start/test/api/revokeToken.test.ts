import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { revokeToken } from "@/lib/api"

beforeEachSetup()

describe("revokeToken", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = authInstance({
            revokeToken: vi.fn().mockResolvedValue({
                success: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const revokeTokenFn = revokeToken(auth)
        const handler = revokeTokenFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({ success: false })
    })

    test("returns success: true when the API reports success", async () => {
        const auth = authInstance({
            revokeToken: vi.fn().mockResolvedValue({
                success: true,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const revokeTokenFn = revokeToken(auth)
        const handler = revokeTokenFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({ success: true })
    })

    test("calls revokeToken with oauth provider extracted from options", async () => {
        const revokeTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            revokeToken: revokeTokenAPI,
        })

        const revokeTokenFn = revokeToken(auth)
        const handler = revokeTokenFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "POST" })
        expect(revokeTokenAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls revokeToken with headers from getRequestHeaders", async () => {
        const revokeTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            revokeToken: revokeTokenAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const revokeTokenFn = revokeToken(auth)
        const handler = revokeTokenFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "POST" })
        expect(revokeTokenAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const revokeTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            revokeToken: revokeTokenAPI,
        })

        const revokeTokenFn = revokeToken(auth)
        const handler = revokeTokenFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "POST" })
        expect(revokeTokenAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers), someOption: "value" })
    })
})
