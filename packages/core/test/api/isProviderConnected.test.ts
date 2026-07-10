import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { api, jose, oauthTokens, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("isProviderConnected", () => {
    test("throws error when provider is not configured", async () => {
        const output = await api.isProviderConnected("unsupported", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            connected: false,
            error: {
                code: "UNSUPPORTED_OAUTH_CONFIGURATION",
                message: "The targeted OAuth provider has not been configured in the initialization parameters.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("throws error when session token is missing", async () => {
        const output = await api.isProviderConnected("oauth-provider", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            connected: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("returns connected: false when provider token cookie does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: true,
            connected: false,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("returns connected: true when provider token cookie exists and is valid", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            connected: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("returns connected: false when provider token cookie is malformed", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=invalid-token`,
            },
        })

        expect(output).toEqual({
            success: false,
            connected: false,
            error: {
                code: "OAUTH_PROVIDER_CONNECTED_ERROR",
                message: "",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedExpiredTokens}`,
            },
        })

        expect(output).toEqual({
            success: false,
            connected: false,
            error: {
                code: "OAUTH_PROVIDER_CONNECTED_ERROR",
                message: "",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("toResponse returns correct response when connected", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        const response = output.toResponse()
        expect(response.status).toBe(200)

        const json = await response.json()
        expect(json).toEqual({
            success: true,
            connected: true,
        })
    })

    test("toResponse returns correct response when not connected", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        const response = output.toResponse()
        expect(response.status).toBe(200)

        const json = await response.json()
        expect(json).toEqual({
            success: true,
            connected: false,
        })
    })

    test("toResponse returns correct response on error", async () => {
        const output = await api.isProviderConnected("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        const json = await response.json()
        expect(json).toEqual({
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

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${expiredSessionToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            connected: false,
            error: {
                code: "SESSION_INVALID",
                message: "The session is not valid. Its signature or decryption parameters failed.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles empty cookie value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=`,
            },
        })

        expect(output).toEqual({
            success: true,
            connected: false,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles multiple providers - checks correct provider", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const output = await api.isProviderConnected("oauth-profile", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; aura-auth.access_token.oauth-provider=${encodedTokens}`,
            },
        })

        expect(output).toEqual({
            success: true,
            connected: false,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("handles malformed cookie header syntax", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const csrfToken = await createCSRF(jose)
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}; malformed-cookie`,
            },
        })

        expect(output).toEqual({
            success: true,
            connected: false,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
