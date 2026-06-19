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

vi.mock("@aura-stack/rate-limiter", async () => {
    const actual = await vi.importActual<typeof import("@aura-stack/rate-limiter")>("@aura-stack/rate-limiter")
    return {
        ...actual,
        createRateLimiter: (...args: Parameters<typeof actual.createRateLimiter>) => {
            const limiters = actual.createRateLimiter(...args)

            for (const limiter of Object.values(limiters)) {
                limiter.check = vi.fn().mockResolvedValue({
                    ok: true,
                    limit: Number.MAX_SAFE_INTEGER,
                    remaining: Number.MAX_SAFE_INTEGER,
                    resetAt: Date.now() + 60000,
                    retryAfter: 0,
                    toResponse: () => new Response(),
                })
            }

            return limiters
        },
    }
})

describe("signIn API", () => {
    test("throws error when provider is missing", async () => {
        expect(await api.signIn("unsupported", { headers: new Headers() })).toMatchObject({
            success: false,
            signInURL: null,
            redirect: false,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
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
            trustedOrigins: ["https://example.com"],
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
                code: "INVALID_AUTH_CONFIGURATION",
                message: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
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
