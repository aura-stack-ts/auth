import { describe, test, expect, vi } from "vitest"
import {
    accountEntity,
    authInstance,
    jose,
    oauthAccountEntity,
    oauthCustomService,
    oauthTokens,
    sessionEntityWithUser,
    userEntity,
} from "@test/presets.ts"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

describe("refreshUserInfo action", () => {
    test("unsupported oauth provider", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const response = await POST(new Request("https://example.com/auth/unsupported/user/refresh", { method: "POST" }))
        expect(await response.json()).toEqual({
            code: "NOT_FOUND",
            type: "ROUTER_FLOW",
            message: "The requested route address cannot be found or is unavailable on this application endpoint server context.",
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is missing", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is invalid", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=valid-token-hash`,
                    "X-CSRF-Token": "invalid-token",
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("throws error when provider token does not exist", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        const tokenHash = await createHash("valid-token-hash")
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("successfully refreshes user info", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

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

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    email: "john.updated@example.com",
                    name: "John Doe Updated",
                    image: "https://example.com/image-updated.jpg",
                },
                expires: expect.any(String),
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

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, tokenHash)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, tokenHash)
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

    test("handles getUserInfo invalid response from provider", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

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
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("handles getUserInfo OAuth error response", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

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
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("handles getUserInfo missing required user fields", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn()
        const getOAuthAccountMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
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
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("handles getProviderTokens failure", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue({
            ...oauthAccountEntity,
            accessTokenExpiresAt: new Date(Date.now() - 3600 * 1000),
        })
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { refreshToken: _, ...spread } = oauthCustomService

        const {
            handlers: { POST },
        } = authInstance(
            {
                getAccountsByUserId: getAccountsByUserIdMock,
                getSessionByToken: getSessionByTokenMock,
                getOAuthAccount: getOAuthAccountMock,
                revokeSession: revokeSessionMock,
                updateOAuthTokens: updateOAuthTokensMock,
                updateUser: updateUserMock,
                updateSession: updateSessionMock,
                touchSession: touchSessionMock,
            },
            { oauth: [spread] }
        )

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
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
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(expiredOAuthAccount)
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

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
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
            }),
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
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
        expect(mockFetch).toHaveBeenCalledTimes(2)

        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, tokenHash)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).toHaveBeenCalledWith("account-123", {
            accountId: "account-123",
            accessToken: "access-token",
            refreshToken: "refresh-token",
            idToken: "id-token",
            tokenType: "Bearer",
            scopes: "scope1 scope2",
            accessTokenExpiresAt: expect.any(Date),
            refreshTokenExpiresAt: expect.any(Date),
        })
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, tokenHash)
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

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "text/plain",
            }),
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
                    Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(spyParseAsPartial).not.toHaveBeenCalled()

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })

    test("successfully refreshes with custom profile function", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([
            {
                ...accountEntity,
                provider: "oauth-profile",
            },
        ])
        const revokeSessionMock = vi.fn()
        const updateOAuthTokensMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateUserMock = vi.fn().mockResolvedValue(sessionEntityWithUser.user)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            revokeSession: revokeSessionMock,
            updateOAuthTokens: updateOAuthTokensMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            json: async () => ({
                id: "1234567890",
                email: "john.updated@example.com",
                name: "John Doe Updated",
                image: "https://example.com/image-updated.jpg",
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
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
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

        const tokenHash = await createHash("valid-token-hash")
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(1, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(2, tokenHash)
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(3, tokenHash)
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateOAuthTokensMock).not.toHaveBeenCalled()
        expect(getSessionByTokenMock).toHaveBeenNthCalledWith(4, tokenHash)
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
            nickname: "johnny",
            email_verified: true,
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
