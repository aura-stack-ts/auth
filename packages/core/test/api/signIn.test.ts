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
        await expect(api.signIn("unsupported", { headers: new Headers() })).rejects.toMatchObject({
            type: "AUTH_INTERNAL_ERROR",
            message: 'The OAuth provider "unsupported" is not configured.',
        })
    })

    test("signIn with BASE_URL", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await api.signIn("oauth-provider")
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with baseURL in context", async () => {
        const api = createAuth({
            oauth: [oauthCustomService],
            baseURL: "https://example.com",
        }).api
        const response = await api.signIn("oauth-provider")
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with trustedProxyHeaders and headers", async () => {
        const api = createAuth({
            oauth: [oauthCustomService],
            trustedProxyHeaders: true,
        }).api
        const response = await api.signIn("oauth-provider", {
            headers: {
                "X-Forwarded-Proto": "https",
                "X-Forwarded-Host": "example.com",
            },
        })
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn with Request object", async () => {
        const response = await api.signIn("oauth-provider", {
            request: new Request("https://example.com/auth/signIn/oauth-provider"),
        })
        expect(response.status).toBe(302)
        const searchParams = new URL(response.headers.get("Location")!).searchParams
        expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback/oauth-provider")
    })

    test("signIn without URL configuration", async () => {
        await expect(api.signIn("oauth-provider")).rejects.toMatchObject({
            type: "AUTH_INTERNAL_ERROR",
            message: "The URL cannot be constructed. Please set the BASE_URL environment variable or enable trustedProxyHeaders.",
        })
    })

    test("signIn with disabled redirect", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await api.signIn("oauth-provider", { redirect: false })
        expect(response.status).toBe(200)
        const data = await response.json()
        expect(data).toEqual({
            redirect: false,
            url: expect.any(String),
        })
    })

    test("signIn with valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await api.signIn("oauth-provider", { redirectTo: "/dashboard" })
        expect(response.status).toBe(302)
        expect(getSetCookie(response, "aura-auth.redirect_to")).toBe("/dashboard")
    })

    test("signIn with invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await api.signIn("oauth-provider", { redirectTo: "https://malicious.com" })
        expect(response.status).toBe(302)
        expect(getSetCookie(response, "aura-auth.redirect_to")).toBe("/")
    })
})
