import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { api, jose, oauthCustomService, oauthTokens, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
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

describe("refreshUserInfo", () => {
    test("unsupported oauth provider", async () => {
        const output = await api.refreshUserInfo("unsupported")
        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("invalid operation when the session token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.refreshUserInfo("oauth-provider", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when CSRF token is missing", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "CSRF_TOKEN_MISSING",
                message: "The CSRF token is missing. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when provider token does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "INVALID_ACCESS_TOKEN_RETRIEVING_REFRESH_USER_INFO",
                message: "Failed to sync profile data. Your active session access token is missing or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("successfully refreshes user info", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                Accept: "application/json",
                Authorization: `Bearer ${oauthTokens.accessToken}`,
            },
            signal: expect.any(AbortSignal),
        })
    })

    test("handles getUserInfo network error gracefully", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "UNKNOWN_OAUTH_USER_INFO_ERROR",
                message: "Failed to communicate clean state down to the user configuration data provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles getUserInfo invalid response from provider", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "INVALID_OAUTH_USER_INFO_RESPONSE",
                message: "The resource userInfo target server returned an error code response.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles getUserInfo OAuth error response", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                error: "invalid_token",
                error_description: "The access token expired",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "INVALID_OAUTH_USER_INFO_RES_FORMAT",
                message: "The returned user info profile structure payload is corrupted or unexpected.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles getUserInfo missing required user fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                email: "john@example.com",
                name: "John Doe",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "UNKNOWN_OAUTH_USER_INFO_ERROR",
                message: "Failed to communicate clean state down to the user configuration data provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("toResponse returns correct response on failure", async () => {
        const output = await api.refreshUserInfo("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles getProviderTokens failure", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const { refreshToken: _, ...spread } = oauthCustomService
        const { api } = createAuth({ oauth: [spread] })

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "INVALID_ACCESS_TOKEN_RETRIEVING_REFRESH_USER_INFO",
                message: "Failed to sync profile data. Your active session access token is missing or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles expired access token with successful refresh", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => oauthTokens,
        })
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output.success).toBe(true)
        expect(output.session).not.toBeNull()
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    test("handles invalid user info response with missing content type", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: {
                get: (name: string) => (name === "content-type" ? "text/html" : null),
            },
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "OAUTH_INVALID_CONTENT_TYPE",
                message:
                    "The identity provider returned an unreadable response format. Please try again or check the provider status.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles session token verification failure", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const invalidSessionToken = "invalid.session.token"

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${invalidSessionToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "SESSION_INVALID",
                message: "The session is not valid. Its signature or decryption parameters failed.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates session cookie with new session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output.success).toBe(true)
        const setCookieHeader = output.headers.get("set-cookie")
        expect(setCookieHeader).toContain("aura-auth.session_token=")
    })

    test("handles malformed provider tokens cookie", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=malformed-token`,
            },
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "INVALID_ACCESS_TOKEN_RETRIEVING_REFRESH_USER_INFO",
                message: "Failed to sync profile data. Your active session access token is missing or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("successfully refreshes with custom profile function", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
                nickname: "johnny",
                email_verified: true,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-profile", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-profile=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("toResponse returns correct response on success", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        const response = output.toResponse()
        expect(response.status).toBe(200)

        expect(await response.json()).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
        })
    })
})
