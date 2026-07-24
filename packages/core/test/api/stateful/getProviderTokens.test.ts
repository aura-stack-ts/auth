import { describe, test, expect, vi } from "vitest"
import { authInstance, jose, oauthCustomService, sessionEntityWithUser } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createAuth } from "@/createAuth.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import type { OAuthProviderConfig } from "@/@types/oauth.ts"

describe("getProviderTokens API (Stateful)", () => {
    test("throws error when provider is missing", async () => {
        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

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
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("throws error when session token is missing", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const output = await api.getProviderTokens("oauth-provider", {
            headers: new Headers({
                Cookie: "aura-auth.session_token=invalid-token",
            }),
        })
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
        expect(getSessionByTokenMock).toHaveBeenCalledOnce()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("throws error when session is not found in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("throws error when OAuth account does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(null)
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("successfully gets provider tokens from database", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                idToken: "id-token",
                tokenType: "Bearer",
                scopes: ["scope1", "scope2"],
            }),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("refreshToken config not provided", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn()

        const { refreshToken: _, ...spread } = oauthCustomService
        const { api } = createAuth({
            oauth: [spread],
            session: {
                strategy: "database",
                adapter: {
                    getSessionByToken: getSessionByTokenMock,
                    getOAuthAccount: getOAuthAccountMock,
                    updateOAuthTokens: updateOAuthTokensMock,
                } as any,
            },
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })

        vi.stubGlobal("fetch", mockFetch)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
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
                refresh_token: "refresh-token",
            }),
            signal: expect.any(AbortSignal),
        })
        expect(updateOAuthTokensMock).toHaveBeenCalledWith(
            "oauth-provider",
            expect.objectContaining({
                accountId: "account-123",
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
            })
        )
    })

    test("refreshToken successfully refreshes tokens with credentials auth in refreshToken config", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })

        const provider: OAuthProviderConfig = {
            ...oauthCustomService,
            refreshToken: {
                url: "https://example.com/oauth/refresh_token",
                authorization: { type: "credentials" },
            },
        }

        const { api } = createAuth({
            oauth: [provider],
            session: {
                strategy: "database",
                adapter: {
                    getSessionByToken: getSessionByTokenMock,
                    getOAuthAccount: getOAuthAccountMock,
                    updateOAuthTokens: updateOAuthTokensMock,
                } as any,
            },
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })

        vi.stubGlobal("fetch", mockFetch)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
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
                refresh_token: "refresh-token",
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
            }),
            signal: expect.any(AbortSignal),
        })
        expect(updateOAuthTokensMock).toHaveBeenCalledWith(
            "oauth-provider",
            expect.objectContaining({
                accountId: "account-123",
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
            })
        )
    })

    test("refreshToken fails when OAuth provider returns an error", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
            json: async () => ({ error: "invalid_grant", error_description: "Refresh token revoked" }),
        })
        vi.stubGlobal("fetch", mockFetch)

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
                code: "OAUTH_INVALID_REFRESH_TOKEN_RESPONSE",
                message: "Your secure session renewal failed. Please sign in again to continue.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("refreshToken handles unexpected network exceptions gracefully", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

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
                code: "PROVIDER_TOKENS_ERROR",
                message: "Failed to get provider tokens",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("returns current tokens without refreshing when close to expiry but outside the refresh window", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const currentTime = Math.floor(Date.now() / 1000)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date((currentTime + 600) * 1000),
            refreshTokenExpiresAt: new Date((currentTime + 7200) * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"
        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                expiresAt: currentTime + 600,
            }),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(mockFetch).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("automatically refreshes the token when its lifetime falls inside the refresh window", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const currentTime = Math.floor(Date.now() / 1000)
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date((currentTime + 120) * 1000),
            refreshTokenExpiresAt: new Date((currentTime + 7200) * 1000),
            updatedAt: new Date(),
        })
        const updateOAuthTokensMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "brand-new-refreshed-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            issuer: "https://example.com",
            accessTokenExpiresAt: new Date((currentTime + 3600) * 1000),
            refreshTokenExpiresAt: new Date((currentTime + 7200) * 1000),
            updatedAt: new Date(),
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "brand-new-refreshed-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.getProviderTokens("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=valid-token-hash`,
            },
        })

        expect(output).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "brand-new-refreshed-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(updateOAuthTokensMock).toHaveBeenCalledWith(
            "oauth-provider",
            expect.objectContaining({
                accountId: "account-123",
                accessToken: "brand-new-refreshed-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
            })
        )
    })
})
