import { describe, test, expect, vi } from "vitest"
import { authInstance, jose, oauthAccountEntity, sessionEntityWithUser } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

describe("refreshUserInfo API (Stateful)", () => {
    test("throws error when provider is missing", async () => {
        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const output = await api.refreshUserInfo("unsupported", { headers: new Headers() })
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
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("throws error when session token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: new Headers({
                Cookie: "aura-auth.session_token=invalid-token",
            }),
        })
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
        expect(getSessionByTokenMock).toHaveBeenCalledOnce()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("throws error when session is not found in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is missing", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const sessionToken = "valid-session-token"

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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("throws error when OAuth account does not exist", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(null)
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("successfully refreshes user info", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output.success).toBe(true)
        expect(output.session).not.toBeNull()
        expect(output.headers).toBeInstanceOf(Headers)
        expect(output.toResponse).toBeInstanceOf(Function)

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionToken)
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(getUserByIdMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(updateUserMock).toHaveBeenCalled()

        vi.unstubAllGlobals()
    })

    test("handles getUserInfo network error gracefully", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

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
                code: "UNKNOWN_OAUTH_USER_INFO_ERROR",
                message: "Failed to communicate clean state down to the user configuration data provider.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        vi.unstubAllGlobals()
    })

    test("handles getUserInfo invalid response from provider", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
        })
        vi.stubGlobal("fetch", mockFetch)

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
                code: "INVALID_OAUTH_USER_INFO_RESPONSE",
                message: "The resource userInfo target server returned an error code response.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        vi.unstubAllGlobals()
    })

    test("handles getUserInfo OAuth error response", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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

        vi.unstubAllGlobals()
    })

    test("handles getUserInfo missing required user fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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

        vi.unstubAllGlobals()
    })

    test("toResponse returns correct response on failure", async () => {
        const { api } = authInstance({})
        const output = await api.refreshUserInfo("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("handles expired access token with successful refresh", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredOAuthAccount = {
            ...oauthAccountEntity,
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
        }

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(expiredOAuthAccount)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
                expires_in: 3600,
                token_type: "Bearer",
            }),
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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output.success).toBe(true)
        expect(output.session).not.toBeNull()
        expect(mockFetch).toHaveBeenCalledTimes(2)
        expect(updateOAuthTokensMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })

        vi.unstubAllGlobals()
    })

    test("handles invalid user info response with missing content type", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
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

        vi.unstubAllGlobals()
    })

    test("handles session token verification failure", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

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
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates session cookie with new session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        expect(output.success).toBe(true)
        const setCookieHeader = output.headers.get("set-cookie")
        expect(setCookieHeader).toContain("aura-auth.session_token=")
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })

        vi.unstubAllGlobals()
    })

    test("toResponse returns correct response on success", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })

        const response = output.toResponse()
        expect(response.status).toBe(200)

        const json = await response.json()
        expect(json).toEqual({
            success: true,
            session: expect.any(Object),
        })
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })

        vi.unstubAllGlobals()
    })

    test("handles token refresh failure", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredOAuthAccount = {
            ...oauthAccountEntity,
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
        }

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(expiredOAuthAccount)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({
                error: "invalid_grant",
                error_description: "Refresh token expired",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

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

        vi.unstubAllGlobals()
    })

    test("handles doubleSubmitToken parameter", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            doubleSubmitToken: csrfToken,
        })

        expect(output.success).toBe(true)
        expect(output.session).not.toBeNull()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })

        vi.unstubAllGlobals()
    })

    test("handles invalid doubleSubmitToken parameter", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            doubleSubmitToken: "invalid-token",
        })

        expect(output).toEqual({
            success: false,
            session: null,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
    })

    test("handles skipCSRFCheck parameter", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const createUserMock = vi.fn()
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateOAuthTokens: updateOAuthTokensMock,
            getUserById: getUserByIdMock,
            createUser: createUserMock,
            createSession: createSessionMock,
            updateUser: updateUserMock,
        })

        const sessionToken = "valid-session-token"
        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValue({
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
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            skipCSRFCheck: true,
        })

        expect(output.success).toBe(true)
        expect(output.session).not.toBeNull()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "oauth",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        vi.unstubAllGlobals()
    })
})
