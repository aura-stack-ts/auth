import { describe, test, expect, vi, afterEach, beforeEach, expectTypeOf } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { GET, jose, oauthTokens, sessionPayload } from "@test/presets.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
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

describe("connectedAction", () => {
    test("throws error when provider is not configured", async () => {
        const response = await GET(new Request("https://example.com/auth/providers/unsupported", { headers: new Headers() }))
        expect(await response.json()).toEqual({
            code: "UNPROCESSABLE_ENTITY",
            type: "VALIDATION",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    test("throws error when session token is missing", async () => {
        const response = await GET(new Request("https://example.com/auth/providers/oauth-provider", { headers: new Headers() }))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })
    })

    test("returns connected: false when provider token cookie does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("returns connected: true when provider token cookie exists and is valid", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: true,
        })
    })

    test("returns connected: false when provider token cookie is malformed", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=invalid-token`,
                },
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })
    })

    test("returns connected: false when provider token cookie is expired", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const expiredTokens = {
            ...oauthTokens,
            exp: Math.floor(Date.now() / 1000) - 3600,
        }
        const encodedExpiredTokens = await jose.encodeJWT(expiredTokens as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedExpiredTokens}`,
                },
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })
    })

    test("handles expired session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)

        const expiredSessionPayload = {
            ...sessionPayload,
            exp: Math.floor(Date.now() / 1000) - 3600,
        }
        const expiredSessionToken = await jose.encodeJWT(expiredSessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${expiredSessionToken}`,
                },
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })
    })

    test("handles empty cookie value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("handles multiple providers - checks correct provider", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-profile", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("handles malformed cookie header syntax", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; malformed-cookie`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })
})
