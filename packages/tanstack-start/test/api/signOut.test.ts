import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders } from "./test-utils"
import { signOut } from "@/lib/api"

beforeEachSetup()

describe("signOut", () => {
    test("returns API data when no redirectURL is in the response", async () => {
        const auth = authInstance({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: null,
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        const output = await handler({ data: {}, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: null, redirect: false })
    })

    test("returns redirectURL when sign-out succeeds and URL is returned", async () => {
        const auth = authInstance({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: "/goodbye",
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        const output = await handler({ data: {}, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/goodbye", redirect: false })
    })

    test("returns success: false when sign-out fails", async () => {
        const auth = authInstance({
            signOut: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: "/goodbye",
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        const output = await handler({ data: {}, method: "POST" })
        expect(output).toEqual({ success: false, redirectURL: "/goodbye", redirect: false })
    })

    test("calls signOut with options", async () => {
        const signOutAPI = vi.fn().mockResolvedValue({
            success: true,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signOut: signOutAPI })

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        await handler({ data: { redirectTo: "/goodbye" }, method: "POST" })
        expect(signOutAPI).toHaveBeenCalledWith({ redirectTo: "/goodbye", headers: expect.any(Headers) })
    })

    test("calls signOut with headers from getRequestHeaders", async () => {
        const signOutAPI = vi.fn().mockResolvedValue({
            success: true,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signOut: signOutAPI })
        const headers = new Headers({ "x-custom": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        await handler({ data: {}, method: "POST" })
        expect(signOutAPI).toHaveBeenCalledWith({ headers: headers })
    })

    test("removes headers and toResponse from the response", async () => {
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: null,
                redirect: false,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const signOutFn = signOut(auth)
        const handler = signOutFn.__executeServer

        const output = await handler({ data: {}, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: null, redirect: false })
    })
})
