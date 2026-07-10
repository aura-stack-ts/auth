import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { api, jose, oauthCustomService, oauthTokens, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import type { OAuthProviderConfig } from "@/@types/oauth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("getProviderTokens API", () => {
    test("throws error when provider is missing", async () => {
        const output = await api.getProviderTokens("unsuppported", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when session token is missing", async () => {
        const output = await api.getProviderTokens("oauth-provider", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when CSRF token is missing", async () => {
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "CSRF_TOKEN_MISSING",
                message: "The CSRF token is missing. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when CSRF token is invalid", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: new Headers({
                Cookie: `aura-auth.csrf_token=invalid-token; aura-auth.session_token=${sessionToken}`,
                "X-CSRF-Token": "invalid-token",
            }),
        })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when provider token does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "COOKIE_INVALID_VALUE",
                message: "Expected configuration cookie not found or contains an empty value.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("successfully gets provider tokens", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: oauthTokens,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("refreshToken config not provided", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const { refreshToken: _, ...spread } = oauthCustomService
        const { api } = createAuth({ oauth: [spread] })

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG",
                message:
                    "Internal library configuration error. Token refresh operations are not enabled or configured for this identity provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("refreshToken successfully refreshes tokens", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => oauthTokens,
        })

        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/refresh_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: createBasicAuthHeader("oauth_client_id", "oauth_client_secret"),
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: oauthTokens.refreshToken!,
            }),
            signal: expect.any(AbortSignal),
        })
    })

    test("refreshToken successfully refreshes tokens with credentials auth in refreshToken config", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => oauthTokens,
        })

        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const provider: OAuthProviderConfig = {
            ...oauthCustomService,
            refreshToken: {
                url: "https://example.com/oauth/refresh_token",
                authorization: { type: "credentials" },
            },
        }

        const { api } = createAuth({
            oauth: [provider],
        })

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/refresh_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                refresh_token: oauthTokens.refreshToken!,
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
            }),
            signal: expect.any(AbortSignal),
        })
    })

    test("refreshToken fails when OAuth provider returns an error", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: "invalid_grant", error_description: "Refresh token revoked" }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "OAUTH_INVALID_REFRESH_TOKEN_RESPONSE",
                message: "Your secure session renewal failed. Please sign in again to continue.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("refreshToken handles unexpected network exceptions gracefully", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            tokens: null,
            error: {
                code: "PROVIDER_TOKENS_ERROR",
                message: "Failed to get provider tokens",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("returns current tokens without refreshing when close to expiry but outside the refresh window", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)
        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const currentTime = Math.floor(Date.now() / 1000)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: currentTime + 600,
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: currentTime + 600,
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test("automatically refreshes the token when its lifetime falls inside the refresh window", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                ...oauthTokens,
                access_token: "brand-new-refreshed-token",
                expires_in: Math.floor(Date.now() / 1000) + 3600,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const currentTime = Math.floor(Date.now() / 1000)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: currentTime + 120,
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                accessToken: "brand-new-refreshed-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test("missing expires_in", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            accessToken: "access-token",
            scopes: ["read:user,read:email"],
            tokenType: "bearer",
        } as unknown as Record<string, unknown>)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: {
                accessToken: "access-token",
                scopes: ["read:user,read:email"],
                tokenType: "Bearer",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
