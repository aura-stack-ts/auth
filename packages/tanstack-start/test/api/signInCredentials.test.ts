import { describe, expect, test, vi } from "vitest"
import { authInstance, beforeEachSetup, mockGetRequestHeaders, mockGetRequest } from "./test-utils"
import { signInCredentials } from "@/lib/api"

beforeEachSetup()

describe("signInCredentials", () => {
    const payload = { username: "alice", password: "secret" }

    test("returns API data when redirect option is false", async () => {
        const apiData = {
            success: true,
            redirectURL: "/dashboard",
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        }
        const auth = authInstance({ signInCredentials: vi.fn().mockResolvedValue(apiData) })

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer
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
        const auth = authInstance({ signInCredentials: vi.fn().mockResolvedValue(apiData) })

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer

        const output = await handler({ data: { payload }, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/dashboard", redirect: true })
    })

    test("returns success: false when sign-in fails", async () => {
        const auth = authInstance({
            signInCredentials: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                redirect: false,
                headers: new Headers(),
                toResponse: vi.fn(),
            }),
        })

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer

        const output = await handler({ data: { payload }, method: "POST" })
        expect(output).toEqual({ success: false, redirectURL: null, redirect: false })
    })

    test("calls signInCredentials with payload and options", async () => {
        const signInCredentialsAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signInCredentials: signInCredentialsAPI })

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer
        await handler({ data: { payload, redirectTo: "/dashboard" }, method: "POST" })

        expect(signInCredentialsAPI).toHaveBeenCalledWith({
            payload,
            redirectTo: "/dashboard",
            request: expect.any(Request),
            headers: expect.any(Headers),
        })
    })

    test("calls signInCredentials with headers from getRequestHeaders", async () => {
        const signInCredentialsAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signInCredentials: signInCredentialsAPI })
        const headers = new Headers({ "x-custom": "value" })
        mockGetRequestHeaders.mockReturnValue(headers)

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer
        await handler({ data: { payload }, method: "POST" })

        expect(signInCredentialsAPI).toHaveBeenCalledWith({ headers: headers, request: expect.any(Request), payload })
    })

    test("calls signInCredentials with request from getRequest", async () => {
        const signInCredentialsAPI = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: null,
            redirect: false,
            headers: new Headers(),
            toResponse: vi.fn(),
        })
        const auth = authInstance({ signInCredentials: signInCredentialsAPI })
        const request = new Request("http://localhost:3000")
        mockGetRequest.mockReturnValue(request)

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer
        await handler({ data: { payload }, method: "POST" })

        expect(signInCredentialsAPI).toHaveBeenCalledWith({
            request: request,
            headers: expect.any(Headers),
            payload,
        })
    })

    test("removes headers and toResponse from the response", async () => {
        const responseHeaders = new Headers({ "x-custom": "value" })
        const auth = authInstance({
            signInCredentials: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: "/dashboard",
                redirect: false,
                headers: responseHeaders,
                toResponse: vi.fn(),
            }),
        })

        const signInCredentialsFn = signInCredentials(auth)
        const handler = signInCredentialsFn.__executeServer

        const output = await handler({ data: { payload, redirect: false }, method: "POST" })
        expect(output).toEqual({ success: true, redirectURL: "/dashboard", redirect: false })
    })
})
