import { describe, test, expect, vi, beforeEach } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { jose, oauthCustomService, oauthTokens, POST, sessionPayload } from "@test/presets.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("Revoke Action", () => {
    test("throws error when provider is not configured", async () => {
        const response = await POST(
            new Request("https://example.com/auth/providers/unsupported/tokens/revoke", {
                method: "POST",
                headers: new Headers(),
            })
        )
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
        vi.stubEnv("BASE_URL", "https://example.com")

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: new Headers(),
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
    })

    test("throws error when CSRF token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ success: false })
    })

    test("throws error when CSRF token is invalid", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
                    "X-CSRF-Token": "invalid-token",
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
    })

    test("throws error when provider token cookie does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
    })

    test("throws error when provider does not have revoke token configured", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const { revokeToken: _, ...spread } = oauthCustomService
        const { handlers } = createAuth({ oauth: [spread] })

        const response = await handlers.POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
        })

        const setCookieHeader = response.headers.get("set-cookie")
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: true })
    })

    test("handles network error during revocation", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
    })

    test("handles malformed provider token cookie", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=invalid-token`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
    })

    test("handles expired session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)

        const expiredSessionPayload = {
            ...sessionPayload,
            exp: Math.floor(Date.now() / 1000) - 3600,
        }
        const expiredSessionToken = await jose.encodeJWT(expiredSessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${expiredSessionToken}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
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
        const { handlers } = createAuth({ oauth: [customRevokeService] })

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await handlers.POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: true })
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
        const { handlers } = createAuth({ oauth: [customRevokeService] })

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await handlers.POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
        })
        expect(mockFetch).toHaveBeenCalled()
        expect(mockFetch).toHaveBeenCalledWith(
            "https://custom.example.com/revoke",
            expect.objectContaining({
                method: "POST",
                body: expect.any(URLSearchParams),
                headers: {
                    Authorization: expect.stringContaining("Basic"),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Custom-Header": "custom-value",
                },
                signal: expect.any(AbortSignal),
            })
        )
    })
})
