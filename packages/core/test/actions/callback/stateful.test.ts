import { describe, test, expect, vi } from "vitest"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"
import {
    oauthCustomService,
    sessionEntityWithUser,
    userEntity,
    authInstance,
    deviceEntity,
    oauthTransactionEntity,
    accountEntity,
} from "@test/presets.ts"

describe("callbackAction (stateful)", () => {
    test("invalid endpoint", async () => {
        const {
            handlers: { GET },
        } = authInstance()
        const response = await GET(new Request("https://example.com/callback/invalid"))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            type: "ROUTER_FLOW",
            code: "NOT_FOUND",
            message: "The requested route address cannot be found or is unavailable on this application endpoint server context.",
        })
    })

    test("endpoint without code and state", async () => {
        const {
            handlers: { GET },
        } = authInstance()
        const response = await GET(new Request("https://example.com/auth/callback/unknown"))
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

    test("supported oauth provider endpoint without code and state", async () => {
        const {
            handlers: { GET },
        } = authInstance()
        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                code: {
                    code: "invalid_type",
                    message: "Missing code parameter in the OAuth authorization response.",
                },
                state: {
                    code: "invalid_type",
                    message: "Missing state parameter in the OAuth authorization response.",
                },
            },
        })
    })

    test("unsupported oauth provider", async () => {
        const {
            handlers: { GET },
        } = authInstance()
        const response = await GET(new Request("https://example.com/auth/callback/unknown?code=123&state=abc"))
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

    test("transaction not found", async () => {
        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(null)

        const {
            handlers: { GET },
        } = authInstance({
            getOAuthTransactionByState: getOAuthTransactionByStateMock,
        })

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            type: "PROTOCOL",
            code: "AUTH_MISMATCHING_STATE",
            message: "The provided state passed in the OAuth response does not match the stored token state.",
        })
        expect(getOAuthTransactionByStateMock).toHaveBeenCalledWith("abc")
    })

    test("transaction expired", async () => {
        const expiredTransaction = {
            id: "transaction-123",
            provider: "oauth-provider",
            state: "abc",
            nonce: null,
            codeVerifier: "verifier_123",
            redirectURI: "https://example.com/auth/callback/oauth-provider",
            redirectTo: "/auth",
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(Date.now() - 20 * 60 * 1000),
            expiresAt: new Date(Date.now() - 10 * 60 * 1000),
            metadata: null,
        }

        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(expiredTransaction)
        const deleteExpiredOAuthTransactionsMock = vi.fn().mockResolvedValue(1)

        const {
            handlers: { GET },
        } = authInstance({
            getOAuthTransactionByState: getOAuthTransactionByStateMock,
            deleteExpiredOAuthTransactions: deleteExpiredOAuthTransactionsMock,
        })

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            type: "PROTOCOL",
            code: "AUTH_TRANSACTION_EXPIRED",
            message: "The OAuth transaction has expired. Please try signing in again.",
        })
        expect(deleteExpiredOAuthTransactionsMock).toHaveBeenCalled()
    })

    test("provider mismatch", async () => {
        const transaction = {
            id: "transaction-123",
            provider: "different-provider",
            state: "abc",
            nonce: null,
            codeVerifier: "verifier_123",
            redirectURI: "https://example.com/auth/callback/different-provider",
            redirectTo: "/auth",
            userAgent: null,
            fingerprint: null,
            deviceId: null,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            metadata: null,
        }

        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(transaction)

        const {
            handlers: { GET },
        } = authInstance({
            getOAuthTransactionByState: getOAuthTransactionByStateMock,
        })

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            type: "PROTOCOL",
            code: "AUTH_PROVIDER_MISMATCH",
            message: "The OAuth provider does not match the stored transaction.",
        })
    })

    test("callback action workflow with new user creation", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        const userInfoMock = {
            id: "user_123",
            email: "newuser@example.com",
            name: "New User",
            picture: "https://example.com/newuser.jpg",
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => userInfoMock,
        })

        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const consumeOAuthTransactionMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const getUserByEmailMock = vi.fn().mockResolvedValue(null)
        const getUserByIdMock = vi.fn().mockResolvedValue(null)
        const createUserMock = vi.fn().mockResolvedValue(userEntity)
        const getAccountByProviderMock = vi.fn().mockResolvedValue(null)
        const createAccountMock = vi.fn().mockResolvedValue({
            id: "account-123",
            userId: userEntity.id,
            provider: "oauth-provider",
            providerUserId: "user_123",
            type: "oauth",
            status: "active",
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access_123",
            refreshToken: null,
            idToken: null,
            tokenType: "bearer",
            scopes: null,
            issuer: null,
            accessTokenExpiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const {
            handlers: { GET },
        } = authInstance(
            {
                getOAuthTransactionByState: getOAuthTransactionByStateMock,
                consumeOAuthTransaction: consumeOAuthTransactionMock,
                getUserByEmail: getUserByEmailMock,
                getUserById: getUserByIdMock,
                createUser: createUserMock,
                getAccountByProvider: getAccountByProviderMock,
                createAccount: createAccountMock,
                createOAuthAccount: createOAuthAccountMock,
                createSession: createSessionMock,
                createDevice: createDeviceMock,
                getDeviceByFingerprint: getDeviceByFingerprintMock,
            },
            {
                oauth: [oauthCustomService],
            }
        )

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc"))

        expect(response.status).toBe(302)
        expect(getUserByEmailMock).toHaveBeenCalledWith("newuser@example.com")
        expect(createUserMock).toHaveBeenCalled()
        expect(createAccountMock).toHaveBeenCalled()
        expect(createOAuthAccountMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalled()
    })

    test("callback action workflow with existing user", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        const userInfoMock = {
            id: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            picture: "https://example.com/john-doe.jpg",
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => userInfoMock,
        })

        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const consumeOAuthTransactionMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const deleteExpiredOAuthTransactionsMock = vi.fn().mockResolvedValue(1)
        const createUserMock = vi.fn().mockResolvedValue(userEntity)
        const getUserByEmailMock = vi.fn().mockResolvedValue(userEntity)
        const updateUserMock = vi.fn().mockResolvedValue(userEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(userEntity)
        const getAccountByProviderMock = vi.fn().mockResolvedValue(accountEntity)
        const updatedOAuthTokensMock = vi.fn()
        const createAccountMock = vi.fn().mockResolvedValue({
            id: "account-123",
            userId: userEntity.id,
            provider: "oauth-provider",
            providerUserId: "user_123",
            type: "oauth",
            status: "active",
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access_123",
            refreshToken: null,
            idToken: null,
            tokenType: "bearer",
            scopes: null,
            issuer: null,
            accessTokenExpiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const {
            handlers: { GET },
        } = authInstance(
            {
                getOAuthTransactionByState: getOAuthTransactionByStateMock,
                consumeOAuthTransaction: consumeOAuthTransactionMock,
                deleteExpiredOAuthTransactions: deleteExpiredOAuthTransactionsMock,
                getUserByEmail: getUserByEmailMock,
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                getAccountByProvider: getAccountByProviderMock,
                updateOAuthTokens: updatedOAuthTokensMock,
                createAccount: createAccountMock,
                createOAuthAccount: createOAuthAccountMock,
                createSession: createSessionMock,
                createDevice: createDeviceMock,
                getDeviceByFingerprint: getDeviceByFingerprintMock,
            },
            {
                oauth: [oauthCustomService],
            }
        )

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc"))

        expect(getOAuthTransactionByStateMock).toHaveBeenCalledWith("abc")
        expect(getOAuthTransactionByStateMock).toHaveReturnedWith(Promise.resolve(oauthTransactionEntity))
        expect(deleteExpiredOAuthTransactionsMock).not.toHaveBeenCalled()
        expect(consumeOAuthTransactionMock).toHaveBeenCalledWith("abc")

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "auth_code_123",
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
                grant_type: "authorization_code",
                code_verifier: "verifier_123",
            }).toString(),
            signal: expect.any(AbortSignal),
        })
        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                Accept: "application/json",
                Authorization: "Bearer access_123",
            },
            signal: expect.any(AbortSignal),
        })
        expect(fetch).toHaveBeenCalledTimes(2)

        expect(getUserByEmailMock).toHaveBeenCalledWith("john.doe@example.com")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
            attributes: {},
        })
        expect(createUserMock).not.toHaveBeenCalled()
        expect(getAccountByProviderMock).toHaveBeenCalledWith("oauth-provider", "user_123")
        expect(getAccountByProviderMock).toHaveReturnedWith(Promise.resolve(accountEntity))

        expect(updatedOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accessToken: "access_123",
            refreshToken: null,
            idToken: null,
            tokenType: "Bearer",
            scopes: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
        })
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(createOAuthAccountMock).not.toHaveBeenCalled()

        expect(getDeviceByFingerprintMock).toHaveBeenCalled()
        expect(createDeviceMock).toHaveBeenCalled()
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")
    })

    test("callback action workflow with existing user and same device", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        const userInfoMock = {
            id: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            picture: "https://example.com/john-doe.jpg",
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => userInfoMock,
        })

        const getOAuthTransactionByStateMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const consumeOAuthTransactionMock = vi.fn().mockResolvedValue(oauthTransactionEntity)
        const deleteExpiredOAuthTransactionsMock = vi.fn().mockResolvedValue(1)
        const createUserMock = vi.fn().mockResolvedValue(userEntity)
        const getUserByEmailMock = vi.fn().mockResolvedValue(userEntity)
        const updateUserMock = vi.fn().mockResolvedValue(userEntity)
        const getUserByIdMock = vi.fn().mockResolvedValue(userEntity)
        const getAccountByProviderMock = vi.fn().mockResolvedValue(accountEntity)
        const updatedOAuthTokensMock = vi.fn()
        const createAccountMock = vi.fn().mockResolvedValue({
            id: "account-123",
            userId: userEntity.id,
            provider: "oauth-provider",
            providerUserId: "user_123",
            type: "oauth",
            status: "active",
            metadata: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createOAuthAccountMock = vi.fn().mockResolvedValue({
            accountId: "account-123",
            accessToken: "access_123",
            refreshToken: null,
            idToken: null,
            tokenType: "bearer",
            scopes: null,
            issuer: null,
            accessTokenExpiresAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        })
        const createSessionMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(deviceEntity)
        const updateDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)

        const {
            handlers: { GET },
        } = authInstance(
            {
                getOAuthTransactionByState: getOAuthTransactionByStateMock,
                consumeOAuthTransaction: consumeOAuthTransactionMock,
                deleteExpiredOAuthTransactions: deleteExpiredOAuthTransactionsMock,
                getUserByEmail: getUserByEmailMock,
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                getAccountByProvider: getAccountByProviderMock,
                updateOAuthTokens: updatedOAuthTokensMock,
                createAccount: createAccountMock,
                createOAuthAccount: createOAuthAccountMock,
                createSession: createSessionMock,
                updateDevice: updateDeviceMock,
                createDevice: createDeviceMock,
                getDeviceByFingerprint: getDeviceByFingerprintMock,
            },
            {
                oauth: [oauthCustomService],
            }
        )

        const response = await GET(new Request("https://example.com/auth/callback/oauth-provider?code=auth_code_123&state=abc"))

        expect(getOAuthTransactionByStateMock).toHaveBeenCalledWith("abc")
        expect(getOAuthTransactionByStateMock).toHaveReturnedWith(Promise.resolve(oauthTransactionEntity))
        expect(deleteExpiredOAuthTransactionsMock).not.toHaveBeenCalled()
        expect(consumeOAuthTransactionMock).toHaveBeenCalledWith("abc")

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "auth_code_123",
                redirect_uri: "https://example.com/auth/callback/oauth-provider",
                grant_type: "authorization_code",
                code_verifier: "verifier_123",
            }).toString(),
            signal: expect.any(AbortSignal),
        })
        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                Accept: "application/json",
                Authorization: "Bearer access_123",
            },
            signal: expect.any(AbortSignal),
        })
        expect(fetch).toHaveBeenCalledTimes(2)

        expect(getUserByEmailMock).toHaveBeenCalledWith("john.doe@example.com")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            name: "John Doe",
            email: "john.doe@example.com",
            image: "https://example.com/john-doe.jpg",
            attributes: {},
        })
        expect(createUserMock).not.toHaveBeenCalled()
        expect(getAccountByProviderMock).toHaveBeenCalledWith("oauth-provider", "user_123")
        expect(getAccountByProviderMock).toHaveReturnedWith(Promise.resolve(accountEntity))

        expect(updatedOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accessToken: "access_123",
            refreshToken: null,
            idToken: null,
            tokenType: "Bearer",
            scopes: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
        })
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(createOAuthAccountMock).not.toHaveBeenCalled()

        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-123", expect.any(String))
        expect(updateDeviceMock).toHaveBeenCalledWith("device-123", {
            lastSeenAt: expect.any(Date),
        })
        expect(createDeviceMock).not.toHaveBeenCalled()
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")
    })
})
