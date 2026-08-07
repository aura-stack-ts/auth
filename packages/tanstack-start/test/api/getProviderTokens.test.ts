import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { getProviderTokens } from "@/lib/api"

beforeEachSetup()

describe("getProviderTokens", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = authInstance({
            getProviderTokens: vi.fn().mockResolvedValue({
                success: false,
                tokens: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getProviderTokensFn = getProviderTokens(auth)
        const handler = getProviderTokensFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({ success: false, tokens: null })
    })

    test("returns success: true and tokens when the API reports success", async () => {
        const auth = authInstance({
            getProviderTokens: vi.fn().mockResolvedValue({
                success: true,
                tokens: { accessToken: "abc123", refreshToken: "def456" },
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getProviderTokensFn = getProviderTokens(auth)
        const handler = getProviderTokensFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "GET" })
        expect(output).toEqual({
            success: true,
            tokens: { accessToken: "abc123", refreshToken: "def456" },
        })
    })

    test("calls getProviderTokens with oauth provider extracted from options", async () => {
        const getProviderTokensAPI = vi.fn().mockResolvedValue({
            success: true,
            tokens: {
                accessToken: "abc123",
                refreshToken: "def456",
            },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getProviderTokens: getProviderTokensAPI,
        })

        const getProviderTokensFn = getProviderTokens(auth)
        const handler = getProviderTokensFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(getProviderTokensAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls getProviderTokens with headers from getRequestHeaders", async () => {
        const getProviderTokensAPI = vi.fn().mockResolvedValue({
            success: true,
            tokens: {
                accessToken: "abc123",
                refreshToken: "def456",
            },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getProviderTokens: getProviderTokensAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const getProviderTokensFn = getProviderTokens(auth)
        const handler = getProviderTokensFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "GET" })
        expect(getProviderTokensAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const getProviderTokensAPI = vi.fn().mockResolvedValue({
            success: true,
            tokens: {
                accessToken: "abc123",
                refreshToken: "def456",
            },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            getProviderTokens: getProviderTokensAPI,
        })

        const getProviderTokensFn = getProviderTokens(auth)
        const handler = getProviderTokensFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "GET" })
        expect(getProviderTokensAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers), someOption: "value" })
    })
})
