import { describe, test, expect, vi } from "vitest"
import { jose, oauthCustomService, oauthTokens, POST, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"

describe("refreshUserInfo action", () => {
    test("unsupported oauth provider", async () => {
        const response = await POST(new Request("https://example.com/auth/unsupported/user/refresh", { method: "POST" }))
        expect(await response.json()).toEqual({
            code: "NOT_FOUND",
            type: "ROUTER_FLOW",
            message: "The requested route address cannot be found or is unavailable on this application endpoint server context.",
        })
    })

    test("invalid operation when the session token is missing", async () => {
        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", { method: "POST" })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("throws error when CSRF token is missing", async () => {
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("throws error when CSRF token is invalid", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
                    "X-CSRF-Token": "invalid-token",
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("throws error when provider token does not exist", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("successfully refreshes user info", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
        })
        expect(response.status).toBe(200)
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
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles getUserInfo invalid response from provider", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles getUserInfo OAuth error response", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles getUserInfo missing required user fields", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles getProviderTokens failure", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT({
            ...oauthTokens,
            expiresAt: Math.floor(Date.now() / 1000) - 3600,
        } as unknown as Record<string, unknown>)

        const { refreshToken: _, ...spread } = oauthCustomService
        const { handlers } = createAuth({ oauth: [spread] })

        const response = await handlers.POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
        })
        expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    test("handles invalid user info response with missing content type", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles session token verification failure", async () => {
        const csrfToken = await createCSRF(jose)
        const invalidSessionToken = "invalid.session.token"

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${invalidSessionToken}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("updates session cookie with new session token", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
            session: {
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            },
        })
        expect(response.headers.get("set-cookie")).toContain("aura-auth.session_token=")
    })

    test("handles malformed provider tokens cookie", async () => {
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=malformed-token`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("successfully refreshes with custom profile function", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-profile/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-profile=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
            session: expect.objectContaining({
                sub: "1234567890",
                email: "john@example.com",
                name: "John Doe",
                image: "https://example.com/image.jpg",
            }),
        })
    })

    test("toResponse returns correct response on success", async () => {
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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

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
