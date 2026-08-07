import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { getSession } from "@/lib/api"

beforeEachSetup()

describe("getSession", () => {
    test("returns null when the API reports success: false", async () => {
        const auth = authInstance({
            getSession: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getSessionFn = getSession(auth)
        const handler = getSessionFn.__executeServer

        const output = await handler({ method: "GET", data: undefined })
        expect(output).toBeNull()
    })

    test("returns the session object when the API reports success: true", async () => {
        const session = { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" }
        const auth = authInstance({
            getSession: vi.fn().mockResolvedValue({
                success: true,
                session,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const getSessionFn = getSession(auth)
        const handler = getSessionFn.__executeServer

        const output = await handler({ method: "GET", data: undefined })
        expect(output).toEqual(session)
    })

    test("calls getSession with headers from getRequestHeaders", async () => {
        const apiGetSession = vi.fn().mockResolvedValue({
            success: true,
            session: null,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ getSession: apiGetSession })
        const headers = new Headers({ "x-test": "val" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const getSessionFn = getSession(auth)
        const handler = getSessionFn.__executeServer

        await handler({ method: "GET", data: undefined })
        expect(apiGetSession).toHaveBeenCalledWith({ headers: headers })
    })

    test("removes headers and toResponse from the response", async () => {
        const session = { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" }
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            getSession: vi.fn().mockResolvedValue({
                success: true,
                session,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const getSessionFn = getSession(auth)
        const handler = getSessionFn.__executeServer
        const output = await handler({ method: "GET", data: undefined })

        expect(output).toEqual(session)
        expect(output).not.toHaveProperty("headers")
        expect(output).not.toHaveProperty("toResponse")
    })
})
