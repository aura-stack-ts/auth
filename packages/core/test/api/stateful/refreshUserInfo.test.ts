import { describe, test, expect, vi } from "vitest"
import { authInstance, jose, oauthAccountEntity, sessionEntityWithUser, userEntity } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

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

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
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
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe Updated",
                    email: "john.updated@example.com",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        /**
         * @todo Optimize the session token verification across multiple calls.
         */
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            ...spreadUser,
            ...attributes,
            sub: "user-123",
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "1234567890",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })

        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: expect.any(String),
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
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
            headers: new Headers({ "Content-Type": "application/json" }),
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
                code: "INVALID_USER_INFO",
                message: "The provider profile identity map did not supply an immutable index key (id/sub/uid).",
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

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(expiredOAuthAccount)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
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
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
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
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe Updated",
                    email: "john.updated@example.com",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).toHaveBeenCalledWith("oauth-provider", {
            accountId: "account-123",
            accessToken: "new-access-token",
            refreshToken: "new-refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            accessTokenExpiresAt: expect.any(Date),
            refreshTokenExpiresAt: expect.any(Date),
        })
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            ...spreadUser,
            ...attributes,
            sub: "user-123",
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "1234567890",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })

        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: expect.any(String),
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
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

    test("toResponse returns correct response on success", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
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
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe Updated",
                    email: "john.updated@example.com",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
            },
        })

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            ...spreadUser,
            ...attributes,
            sub: "user-123",
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "1234567890",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })

        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: expect.any(String),
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
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

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
            doubleSubmitToken: csrfToken,
        })

        expect(output).toEqual({
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe Updated",
                    email: "john.updated@example.com",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            ...spreadUser,
            ...attributes,
            sub: "user-123",
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "1234567890",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })

        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: expect.any(String),
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
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

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const sessionToken = "valid-session-token"
        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValue({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const output = await api.refreshUserInfo("oauth-provider", {
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            skipCSRFCheck: true,
        })

        expect(output).toEqual({
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe Updated",
                    email: "john.updated@example.com",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, sessionToken)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).toHaveBeenCalledWith("oauth-provider")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, sessionToken)
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            ...spreadUser,
            ...attributes,
            sub: "user-123",
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "1234567890",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john.updated@example.com",
            name: "John Doe Updated",
            image: "https://example.com/image-updated.jpg",
        })

        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: expect.any(String),
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })
})
