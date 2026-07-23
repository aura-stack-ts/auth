import { describe, test, expect, vi, beforeEach } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { GET, jose, oauthCustomService, oauthTokens, sessionPayload } from "@test/presets.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import type { OAuthProviderConfig } from "@/@types/oauth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("tokensAction", async () => {
    const { encodeJWT } = jose

    test("should return 422 if the provider is not supported", async () => {
        const response = await GET(new Request("https://example.com/auth/providers/unsupported/tokens"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    test("should return 401 if session token is missing", async () => {
        const response = await GET(new Request("https://example.com/auth/providers/oauth-provider/tokens"))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("should return 403 if CSRF token is missing", async () => {
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: { Cookie: `__Secure-aura-auth.session_token=${sessionToken}` },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("should return 403 if CSRF token is invalid", async () => {
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "x-csrf-token": "invalid-token",
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("should return 403 if provider token doesn not exist", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("successfully get provider tokens", async () => {
        const csrfToken = await createCSRF(jose)
        const encodedTokens = await encodeJWT(oauthTokens as unknown as Record<string, unknown>)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: oauthTokens,
        })
    })

    test("refreshToken config not provided", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const { refreshToken: _, ...spread } = oauthCustomService
        const {
            handlers: { GET },
        } = createAuth({ oauth: [spread] })

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("refreshToken successfully refreshes tokens", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => oauthTokens,
        })
        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            },
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

    test("refreshToken successfully refreshes tokens with credentials auth", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn().mockResolvedValueOnce({
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

        const {
            handlers: { GET },
        } = createAuth({
            oauth: [provider],
        })

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            },
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

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("refreshToken handles unexpected network exceptions gracefully", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)
        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
    })

    test("returns current tokens without refreshing when close to expiry but outside the refresh window", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const currentTime = Math.floor(Date.now() / 1000)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: currentTime + 600,
        } as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                expiresAt: currentTime + 600,
            },
        })
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test("automatically refreshes the token when its lifetime falls inside the refresh window", async () => {
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

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: {
                ...oauthTokens,
                accessToken: "brand-new-refreshed-token",
                issuedAt: expect.any(Number),
                expiresAt: expect.any(Number),
            },
        })
        expect(mockFetch).toHaveBeenCalledTimes(1)
    })
})
