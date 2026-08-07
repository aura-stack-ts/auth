import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { getAccessToken } from "@/lib/api"

beforeEachSetup()

describe("getAccessToken", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = authInstance({
            getAccessToken: vi.fn().mockResolvedValue({
                success: false,
                accessToken: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getAccessTokenFn = getAccessToken(auth)
        const handler = getAccessTokenFn.__executeServer
        const output = await handler({ data: { oauth: "github" }, method: "GET" })

        expect(output).toEqual({ success: false, accessToken: null })
    })

    test("returns success: true and accessToken when the API reports success", async () => {
        const auth = authInstance({
            getAccessToken: vi.fn().mockResolvedValue({
                success: true,
                accessToken: "xyz789",
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getAccessTokenFn = getAccessToken(auth)
        const handler = getAccessTokenFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({
            success: true,
            accessToken: "xyz789",
        })
    })

    test("calls getAccessToken with oauth provider extracted from options", async () => {
        const getAcessTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            accessToken: "xyz789",
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getAccessToken: getAcessTokenAPI,
        })

        const getAccessTokenFn = getAccessToken(auth)
        const handler = getAccessTokenFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(getAcessTokenAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls getAccessToken with headers from getRequestHeaders", async () => {
        const getAcessTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            accessToken: "xyz789",
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getAccessToken: getAcessTokenAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const getAccessTokenFn = getAccessToken(auth)
        const handler = getAccessTokenFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(getAcessTokenAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const getAcessTokenAPI = vi.fn().mockResolvedValue({
            success: true,
            accessToken: "xyz789",
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getAccessToken: getAcessTokenAPI,
        })

        const getAccessTokenFn = getAccessToken(auth)
        const handler = getAccessTokenFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "GET" })
        expect(getAcessTokenAPI).toHaveBeenCalledWith("github", { someOption: "value", headers: expect.any(Headers) })
    })
})
