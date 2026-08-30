import { describe, test, expect, vi } from "vitest"
import { accountEntity, authInstance, jose, oauthCustomService, sessionEntityWithUser } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import type { OAuthProviderConfig } from "@/@types/oauth.ts"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import type { DatabaseAdapter } from "@/@types/adapter.ts"

describe("tokensAction (Stateful)", async () => {
    test("should return 422 if the provider is not supported", async () => {
        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

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
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("should return 401 if session token is missing", async () => {
        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const response = await GET(new Request("https://example.com/auth/providers/oauth-provider/tokens"))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("should return 401 if session is not found in database", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("should return 401 if OAuth account does not exist", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(null)
        const updateOAuthTokensMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("successfully get provider tokens from database", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                idToken: "id-token",
                tokenType: "Bearer",
                scopes: ["scope1", "scope2"],
            }),
        })
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("refreshToken config not provided", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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
        const {
            handlers: { GET },
        } = createAuth({
            oauth: [spread],
            session: {
                strategy: "database",
                adapter: {
                    getSessionByToken: getSessionByTokenMock,
                    getOAuthAccount: getOAuthAccountMock,
                    updateOAuthTokens: updateOAuthTokensMock,
                    getAccountsByUserId: getAccountsByUserIdMock,
                } as Partial<DatabaseAdapter> as DatabaseAdapter,
            },
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
    })

    test("refreshToken successfully refreshes tokens", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
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
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accountId: "account-123",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            scopes: "scope1 scope2",
            tokenType: "Bearer",
            accessTokenExpiresAt: expect.any(Date),
            refreshTokenExpiresAt: expect.any(Date),
        })
    })

    test("refreshToken successfully refreshes tokens with credentials auth", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = createAuth({
            oauth: [provider],
            session: {
                strategy: "database",
                adapter: {
                    getSessionByToken: getSessionByTokenMock,
                    getAccountsByUserId: getAccountsByUserIdMock,
                    getOAuthAccount: getOAuthAccountMock,
                    updateOAuthTokens: updateOAuthTokensMock,
                } as Partial<DatabaseAdapter> as DatabaseAdapter,
            },
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "new-access-token",
                refreshToken: "new-refresh-token",
                idToken: "new-id-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
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
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accountId: "account-123",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            scopes: "scope1 scope2",
            tokenType: "Bearer",
            accessTokenExpiresAt: expect.any(Date),
            refreshTokenExpiresAt: expect.any(Date),
        })
    })

    test("refreshToken fails when OAuth provider returns an error", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
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

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("refreshToken handles unexpected network exceptions gracefully", async () => {
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"
        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            tokens: null,
        })
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("returns current tokens without refreshing when close to expiry but outside the refresh window", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const currentTime = Math.floor(Date.now() / 1000)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"
        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "access-token",
                refreshToken: "refresh-token",
                expiresAt: currentTime + 600,
            }),
        })
        expect(mockFetch).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
    })

    test("automatically refreshes the token when its lifetime falls inside the refresh window", async () => {
        const getSessionByTokenMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const currentTime = Math.floor(Date.now() / 1000)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"
        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                access_token: "brand-new-refreshed-token",
                refresh_token: "new-refresh-token",
                id_token: "new-id-token",
                expires_in: 3600,
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider/tokens", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            tokens: expect.objectContaining({
                accessToken: "brand-new-refreshed-token",
                expiresAt: expect.any(Number),
                issuedAt: expect.any(Number),
            }),
        })
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accountId: "account-123",
            accessToken: "brand-new-refreshed-token",
            refreshToken: "new-refresh-token",
            idToken: "new-id-token",
            scopes: "scope1 scope2",
            tokenType: "Bearer",
            accessTokenExpiresAt: expect.any(Date),
            refreshTokenExpiresAt: expect.any(Date),
        })
    })
})
