import { describe, test, expect, vi, beforeEach } from "vitest"
import { api, jose, oauthCustomService, oauthTokens, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("revokeToken", () => {
    test("throws error when provider is not configured", async () => {
        const output = await api.revokeToken("unsupported", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when session token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.revokeToken("oauth-provider", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when CSRF token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
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
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
                "X-CSRF-Token": "invalid-token",
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "COOKIE_INVALID_VALUE",
                message: "Expected configuration cookie not found or contains an empty value.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when provider token cookie does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "COOKIE_INVALID_VALUE",
                message: "Expected configuration cookie not found or contains an empty value.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when provider does not have revoke token configured", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const { revokeToken: _, ...spread } = oauthCustomService
        const { api: apiWithoutRevoke } = createAuth({ oauth: [spread] })

        const output = await apiWithoutRevoke.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "OAUTH_INVALID_REVOKE_TOKEN_CONFIG",
                message:
                    "Internal library configuration error. Token revocation operations are not enabled or configured for this identity provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("successfully revokes token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        const setCookieHeader = output.headers.get("set-cookie")
        expect(setCookieHeader).toContain("aura-auth.access_token.oauth-provider=")
        expect(setCookieHeader).toContain("Expires=")

        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/revoke_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: expect.stringContaining("Basic"),
            },
            body: expect.any(URLSearchParams),
            signal: expect.any(AbortSignal),
        })
    })

    test("successfully revokes token with 204 status", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output.success).toBe(true)
    })

    test("handles network error during revocation", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "UNKNOWN_REVOKE_TOKEN_ERROR",
                message: "Failed to revoke token for the OAuth provider",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles provider returning error response", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "OAUTH_INVALID_REVOKE_TOKEN_RESPONSE",
                message: "Failed to communicate token revocation down to the identity provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles provider returning unexpected status code", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 201,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "OAUTH_INVALID_REVOKE_TOKEN_PROCESS",
                message: "The identity provider encountered an error while processing the token revocation.",
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
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        const response = output.toResponse()
        expect(response.status).toBe(200)

        const responseBody = await response.json()
        expect(responseBody).toEqual({
            success: true,
        })
    })

    test("toResponse returns correct response on failure", async () => {
        const output = await api.revokeToken("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        const responseBody = await response.json()
        expect(responseBody).toEqual({
            success: false,
        })
    })

    test("handles malformed provider token cookie", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=invalid-token`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "UNKNOWN_REVOKE_TOKEN_ERROR",
                message: "Failed to revoke token for the OAuth provider",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${expiredSessionToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_INVALID",
                message: "The session is not valid. Its signature or decryption parameters failed.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles provider with custom revoke token URL", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const customRevokeService = {
            ...oauthCustomService,
            revokeToken: "https://custom.example.com/revoke",
        }
        const { api: customApi } = createAuth({ oauth: [customRevokeService] })

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await customApi.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output.success).toBe(true)
        expect(mockFetch).toHaveBeenCalledWith("https://custom.example.com/revoke", expect.any(Object))
    })

    test("handles provider with custom revoke token config object", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const customRevokeService = {
            ...oauthCustomService,
            revokeToken: {
                url: "https://custom.example.com/revoke",
                params: {
                    tokenHint: "refresh_token",
                },
                headers: {
                    "X-Custom-Header": "custom-value",
                },
            },
        }
        const { api: customApi } = createAuth({ oauth: [customRevokeService] })

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await customApi.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output.success).toBe(true)
        expect(mockFetch).toHaveBeenCalledWith(
            "https://custom.example.com/revoke",
            expect.objectContaining({
                headers: expect.objectContaining({
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Custom-Header": "custom-value",
                }),
            })
        )
    })
})
