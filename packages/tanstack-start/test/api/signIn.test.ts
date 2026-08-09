import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders, mockGetRequest } from "./test-utils"
import { signIn } from "@/lib/api"

beforeEachSetup()

describe("signIn", () => {
    test("returns the API data when redirect option is false", async () => {
        const apiData = { success: true, signInURL: "https://oauth.example.com", redirect: false }
        const auth = authInstance({
            signIn: vi.fn().mockResolvedValue({
                ...apiData,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        const output = await handler({ data: { providerId: "github", redirect: false }, method: "POST" })
        expect(output).toEqual({ success: true, signInURL: "https://oauth.example.com", redirect: false })
    })

    test("includes redirect: true when redirect option is not provided", async () => {
        const apiData = { success: true, signInURL: "https://oauth.example.com", redirect: true }
        const auth = authInstance({
            signIn: vi.fn().mockResolvedValue({
                ...apiData,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        const output = await handler({ data: { providerId: "github" }, method: "POST" })
        expect(output).toEqual({ success: true, signInURL: "https://oauth.example.com", redirect: true })
    })

    test("returns success: false when sign-in fails", async () => {
        const auth = authInstance({
            signIn: vi.fn().mockResolvedValue({
                success: false,
                signInURL: null,
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        const output = await handler({ data: { providerId: "github" }, method: "POST" })
        expect(output).toEqual({ success: false, signInURL: null, redirect: false })
    })

    test("calls signIn with providerId extracted from options", async () => {
        const signInAPI = vi.fn().mockResolvedValue({
            success: false,
            signInURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signIn: signInAPI })

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        await handler({ data: { providerId: "github", redirectTo: "/home" }, method: "POST" })
        expect(signInAPI).toHaveBeenCalledWith("github", {
            redirectTo: "/home",
            headers: expect.any(Headers),
            request: expect.any(Request),
        })
    })

    test("calls signIn with headers from getRequestHeaders", async () => {
        const signInAPI = vi.fn().mockResolvedValue({
            success: false,
            signInURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signIn: signInAPI })
        const headers = new Headers({ "x-custom": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        await handler({ data: { providerId: "github" }, method: "POST" })
        expect(signInAPI).toHaveBeenCalledWith("github", { headers: headers, request: expect.any(Request) })
    })

    test("calls signIn with request from getRequest", async () => {
        const signInAPI = vi.fn().mockResolvedValue({
            success: false,
            signInURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signIn: signInAPI })
        const request = new Request("http://localhost:3000")
        mockGetRequest.mockReturnValue(request)

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer
        await handler({ data: { providerId: "github" }, method: "POST" })

        expect(signInAPI).toHaveBeenCalledWith("github", { request: request, headers: expect.any(Headers) })
    })

    test("removes headers and toResponse from the response", async () => {
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            signIn: vi.fn().mockResolvedValue({
                success: true,
                signInURL: "https://oauth.example.com",
                redirect: false,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const signInFn = signIn(auth)
        const handler = signInFn.__executeServer

        const output = await handler({ data: { providerId: "github", redirect: false }, method: "POST" })
        expect(output).toEqual({ success: true, signInURL: "https://oauth.example.com", redirect: false })
    })
})
