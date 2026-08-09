import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders, mockGetRequest } from "./test-utils"
import { signUp } from "@/lib/api"

beforeEachSetup()

describe("signUp", () => {
    const payload = { email: "alice@example.com", password: "secret" }

    test("returns API data when redirect option is false", async () => {
        const apiData = {
            success: true,
            redirectURL: "/dashboard",
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        }
        const auth = authInstance({ signUp: vi.fn().mockResolvedValue(apiData) })

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        const output = await handler({ data: { payload, redirect: false }, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/dashboard", redirect: false })
    })

    test("includes redirect: true when redirect option is not provided", async () => {
        const apiData = {
            success: true,
            redirectURL: "/dashboard",
            redirect: true,
            headers: new Headers(),
            toResponse: vi.fn(),
        }
        const auth = authInstance({ signUp: vi.fn().mockResolvedValue(apiData) })

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        const output = await handler({ data: { payload }, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/dashboard", redirect: true })
    })

    test("returns success: false when sign-up fails", async () => {
        const auth = authInstance({
            signUp: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        const output = await handler({ data: { payload }, method: "POST" })
        expect(output).toEqual({ success: false, redirectURL: null, redirect: false })
    })

    test("calls signUp with payload and options", async () => {
        const signUpAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signUp: signUpAPI })

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        await handler({ data: { payload, redirectTo: "/dashboard" }, method: "POST" })
        expect(signUpAPI).toHaveBeenCalledWith({
            payload,
            redirectTo: "/dashboard",
            headers: expect.any(Headers),
            request: expect.any(Request),
        })
    })

    test("calls signUp with headers from getRequestHeaders", async () => {
        const signUpAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signUp: signUpAPI })
        const headers = new Headers({ "x-custom": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        await handler({ data: { payload }, method: "POST" })
        expect(signUpAPI).toHaveBeenCalledWith({ headers, request: expect.any(Request), payload })
    })

    test("calls signUp with request from getRequest", async () => {
        const signUpAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signUp: signUpAPI })
        const request = new Request("http://localhost:3000")
        mockGetRequest.mockReturnValue(request)

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        await handler({ data: { payload }, method: "POST" })
        expect(signUpAPI).toHaveBeenCalledWith({ request: request, headers: expect.any(Headers), payload })
    })

    test("removes headers and toResponse from the response", async () => {
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            signUp: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: "/dashboard",
                redirect: false,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const signUpFn = signUp(auth)
        const handler = signUpFn.__executeServer

        const output = await handler({ data: { payload, redirect: false }, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/dashboard", redirect: false })
    })
})
