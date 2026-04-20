import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { getSetCookie } from "@/cookie.ts"
import { createAuth } from "@/createAuth.ts"
import { api, oauthCustomService } from "@test/presets.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("signIn API", () => {
    test("throws error when provider is missing", async () => {
        expect(await api.signIn("unsupported", { headers: new Headers() })).toMatchObject({
            success: false,
            signInURL: null,
            redirect: false,
            error: {
                code: "INVALID_OAUTH_CONFIGURATION",
                message: 'The OAuth provider "unsupported" is not configured.',
            },
            toResponse: expect.any(Function),
        })
    })

    test("signIn with BASE_URL", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signIn("oauth-provider")
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with baseURL in context", async () => {
        const api = createAuth({
            oauth: [oauthCustomService],
            baseURL: "https://example.com",
        }).api
        const signIn = await api.signIn("oauth-provider")
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with trustedProxyHeaders and headers", async () => {
        const api = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        }).api
        const signIn = await api.signIn("oauth-provider", {
            headers: {
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Host": "example.com",
            },
        })
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with Request object", async () => {
        const signIn = await api.signIn("oauth-provider", {
            request: new Request("https://example.com/auth/signIn/oauth-provider"),
        })
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn without URL configuration", async () => {
        expect(await api.signIn("oauth-provider")).toMatchObject({
            success: false,
            signInURL: null,
            redirect: false,
            error: {
                code: "INVALID_OAUTH_CONFIGURATION",
                message:
                    "The URL cannot be constructed. Please set the BASE_URL environment variable or enable trustedProxyHeaders.",
            },
            toResponse: expect.any(Function),
        })
    })

    test("signIn with disabled redirect", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await api.signIn("oauth-provider", {
            redirect: false,
        })
        expect(response).toMatchObject({
            success: true,
            redirect: false,
            signInURL: expect.any(String),
            toResponse: expect.any(Function),
        })
    })

    test("signIn with asResponse", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const signIn = await api.signIn("oauth-provider", {
            redirect: true,
        })
        const response = signIn.toResponse()
        expect(response).toBeInstanceOf(Response)
        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            signInURL: expect.any(String),
        })
        expect(getSetCookie(response, "aura-auth.state")).toBeDefined()
    })

    test("signIn with valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signIn("oauth-provider", { redirectTo: "/dashboard" })
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        expect(getSetCookie(response, "aura-auth.redirect_to")).toBe("/dashboard")
    })

    test("signIn with invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signIn("oauth-provider", { redirectTo: "https://malicious.com" })
        const response = signIn.toResponse()
        expect(response.status).toBe(302)
        expect(getSetCookie(response, "aura-auth.redirect_to")).toBe("/")
    })
})
