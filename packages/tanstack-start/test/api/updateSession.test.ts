import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { updateSession } from "@/lib/api"

beforeEachSetup()

describe("updateSession", () => {
    test("returns updated session data when no redirectTo is given", async () => {
        const session = { user: { sub: "u1", name: "Updated" }, expires: "2099-01-01" }
        const auth = authInstance({
            updateSession: vi.fn().mockResolvedValue({
                success: true,
                session,
                redirectURL: null,
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer

        const output = await handler({ data: { session: { user: { name: "Updated" } } }, method: "POST" })
        expect(output).toEqual({ success: true, session, redirect: false, redirectURL: null })
    })

    test("returns redirectURL when redirectTo is set and update succeeds", async () => {
        const auth = authInstance({
            updateSession: vi.fn().mockResolvedValue({
                success: true,
                session: { user: { name: "Bob" } },
                redirectURL: "/profile",
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer

        const output = await handler({
            data: { session: { user: { name: "Alice" } }, redirectTo: "/profile" },
            method: "POST",
        })
        expect(output).toEqual({ success: true, redirectURL: "/profile", redirect: false, session: { user: { name: "Bob" } } })
    })

    test("returns success: false when update fails", async () => {
        const auth = authInstance({
            updateSession: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                redirectURL: "/profile",
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer

        const output = await handler({ data: { session: { user: { name: "Bob" } }, redirectTo: "/profile" }, method: "POST" })
        expect(output).toEqual({ success: false, session: null, redirectURL: "/profile", redirect: false })
    })

    test("calls updateSession with session and options", async () => {
        const updateSessionAPI = vi.fn().mockResolvedValue({
            success: true,
            session: {},
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ updateSession: updateSessionAPI })

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer
        const payload = { user: { name: "Alice" } }

        await handler({ data: { session: payload, redirectTo: "/profile" }, method: "POST" })
        expect(updateSessionAPI).toHaveBeenCalledWith({
            headers: expect.any(Headers),
            session: payload,
            redirectTo: "/profile",
        })
    })

    test("calls updateSession with headers from getRequestHeaders", async () => {
        const updateSessionAPI = vi.fn().mockResolvedValue({
            success: true,
            session: {},
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ updateSession: updateSessionAPI })
        const headers = new Headers({ "x-custom": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer

        await handler({ data: { session: { user: { name: "Alice" } } }, method: "POST" })
        expect(updateSessionAPI).toHaveBeenCalledWith({ headers, session: { user: { name: "Alice" } } })
    })

    test("removes headers and toResponse from the response", async () => {
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            updateSession: vi.fn().mockResolvedValue({
                success: true,
                session: {},
                redirectURL: null,
                redirect: false,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const updateSessionFn = updateSession(auth)
        const handler = updateSessionFn.__executeServer

        const output = await handler({ data: { session: { user: { name: "Alice" } } }, method: "POST" })
        expect(output).toEqual({ success: true, session: {}, redirectURL: null, redirect: false })
    })
})
