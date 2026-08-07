import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { refreshUserInfo } from "@/lib/api"

beforeEachSetup()

describe("refreshUserInfo", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = authInstance({
            refreshUserInfo: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const refreshUserInfoFn = refreshUserInfo(auth)
        const handler = refreshUserInfoFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({ success: false, session: null })
    })

    test("returns success: true and session when the API reports success", async () => {
        const session = { user: { sub: "u1", name: "Alice Updated" }, expires: "2099-01-01" }
        const auth = authInstance({
            refreshUserInfo: vi.fn().mockResolvedValue({
                success: true,
                session,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const refreshUserInfoFn = refreshUserInfo(auth)
        const handler = refreshUserInfoFn.__executeServer

        const output = await handler({ data: { oauth: "github" }, method: "POST" })
        expect(output).toEqual({
            success: true,
            session,
        })
    })

    test("calls refreshUserInfo with oauth provider extracted from options", async () => {
        const refreshUserInfoAPI = vi.fn().mockResolvedValue({
            success: true,
            session: { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            refreshUserInfo: refreshUserInfoAPI,
        })

        const refreshUserInfoFn = refreshUserInfo(auth)
        const handler = refreshUserInfoFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "POST" })
        expect(refreshUserInfoAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers) })
    })

    test("calls refreshUserInfo with headers from getRequestHeaders", async () => {
        const refreshUserInfoAPI = vi.fn().mockResolvedValue({
            success: true,
            session: { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            refreshUserInfo: refreshUserInfoAPI,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const refreshUserInfoFn = refreshUserInfo(auth)
        const handler = refreshUserInfoFn.__executeServer

        await handler({ data: { oauth: "github" }, method: "POST" })
        expect(refreshUserInfoAPI).toHaveBeenCalledWith("github", { headers })
    })

    test("passes additional options to the API call", async () => {
        const refreshUserInfoAPI = vi.fn().mockResolvedValue({
            success: true,
            session: { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" },
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({
            refreshUserInfo: refreshUserInfoAPI,
        })

        const refreshUserInfoFn = refreshUserInfo(auth)
        const handler = refreshUserInfoFn.__executeServer

        await handler({ data: { oauth: "github", someOption: "value" }, method: "POST" })
        expect(refreshUserInfoAPI).toHaveBeenCalledWith("github", { headers: expect.any(Headers), someOption: "value" })
    })
})
