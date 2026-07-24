import { describe, test, expect, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { authInstance, jose, oauthCustomService, sessionEntityWithUser } from "@test/presets.ts"

describe("revokeToken (Stateful)", () => {
    test("throws error when provider is not configured", async () => {
        const { api } = authInstance({})

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

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const output = await api.revokeToken("oauth-provider", { headers: new Headers() })
        expect(output).toEqual({
            success: false,
            error: {
                code: "COOKIE_NOT_FOUND",
                message: "No cookies found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash`,
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
        expect(getSessionByTokenMock).toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is invalid", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=valid-token-hash`,
                "X-CSRF-Token": "invalid-token",
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "OAUTH_UNLINKED_ACCOUNT_ERROR",
                message: "The specified identity provider is not connected to your account.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledTimes(2)
        expect(getOAuthAccountMock).toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when session not found in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when OAuth account does not exist in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(null)
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "OAUTH_UNLINKED_ACCOUNT_ERROR",
                message: "The specified identity provider is not connected to your account.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("successfully revokes token with OAuth provider call and database unlink", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
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

    test("successfully revokes token with disconnect=true (only database unlink, no OAuth call)", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({ success: true }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.disconnectProvider("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test("handles network error during OAuth provider revocation", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider returning error response", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider returning unexpected status code", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 201,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("toResponse returns correct response on success", async () => {
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
            accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            refreshTokenExpiresAt: new Date(Date.now() + 7200 * 1000),
            updatedAt: new Date(),
        })
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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
        const { api } = authInstance({})
        const output = await api.revokeToken("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        const responseBody = await response.json()
        expect(responseBody).toEqual({
            success: false,
        })
    })

    test("handles expired session", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredSession = {
            ...sessionEntityWithUser,
            expiresAt: new Date(Date.now() - 3600 * 1000),
            status: "active" as const,
        }
        const getSessionByTokenMock = vi.fn().mockResolvedValue(expiredSession)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()
        const revokeSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
            revokeSession: revokeSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(revokeSessionMock).toHaveBeenCalledWith(expiredSession.id, "user_logout")
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles session with inactive status", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const inactiveSession = {
            ...sessionEntityWithUser,
            status: "revoked" as const,
        }
        const getSessionByTokenMock = vi.fn()
        getSessionByTokenMock.mockResolvedValueOnce(inactiveSession)
        getSessionByTokenMock.mockResolvedValueOnce(inactiveSession)

        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider with custom revoke token URL", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

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
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const customRevokeService = {
            ...oauthCustomService,
            revokeToken: "https://custom.example.com/revoke",
        }
        const { api } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getOAuthAccount: getOAuthAccountMock,
                updateAccountStatus: updateAccountStatusMock,
            },
            { oauth: [customRevokeService] }
        )

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output.success).toBe(true)
        expect(mockFetch).toHaveBeenCalledWith("https://custom.example.com/revoke", expect.any(Object))
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
    })

    test("handles provider with custom revoke token config object", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

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
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

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

        const { api } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getOAuthAccount: getOAuthAccountMock,
                updateAccountStatus: updateAccountStatusMock,
            },
            { oauth: [customRevokeService] }
        )

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
    })

    test("revokeToken with doubleSubmitToken", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

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
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            doubleSubmitToken: csrfToken,
        })

        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
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

    test("revokeToken with doubleSubmitToken and invalid value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            doubleSubmitToken: "invalid-token",
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledOnce()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
        expect(mockFetch).not.toHaveBeenCalled()
    })

    test("revokeToken enables double-submit cookie manually", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

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
        const updateAccountStatusMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            status: "unlinked",
        })

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            skipCSRFCheck: false,
        })

        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
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

    test("revokeToken enables double-submit cookie manually and invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.revokeToken("oauth-provider", {
            headers: {
                "X-CSRF-Token": "invalid-token",
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            skipCSRFCheck: false,
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledOnce()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
        expect(mockFetch).not.toHaveBeenCalled()
    })
})
