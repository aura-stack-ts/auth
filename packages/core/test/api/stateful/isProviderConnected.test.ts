import { describe, test, expect, vi } from "vitest"
import { authInstance, jose, sessionEntityWithUser } from "@test/presets.ts"
import { createCSRF, createHash } from "@/shared/crypto.ts"

describe("isProviderConnected (Stateful)", () => {
    test("throws error when provider is not configured", async () => {
        const { api } = authInstance({})

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

    test("returns connected: false when session not found in database", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser).mockResolvedValueOnce(null)
        const getAccountsByUserIdMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("returns connected: false when session is expired", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredSession = {
            ...sessionEntityWithUser,
            expiresAt: new Date(Date.now() - 3600 * 1000),
            status: "active" as const,
        }
        const getSessionByTokenMock = vi.fn().mockResolvedValue(expiredSession)
        const getAccountsByUserIdMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("returns connected: false when session is inactive", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const inactiveSession = {
            ...sessionEntityWithUser,
            status: "revoked" as const,
        }
        const getSessionByTokenMock = vi.fn().mockResolvedValue(inactiveSession)
        const getAccountsByUserIdMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("returns connected: false when OAuth account does not exist for user", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith(sessionEntityWithUser.userId)
    })

    test("returns connected: false when account does not exist for provider", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([
            {
                id: "account-456",
                userId: sessionEntityWithUser.userId,
                provider: "other-provider",
                providerUserId: "other-provider-user",
                type: "oauth" as const,
                status: "active" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith(sessionEntityWithUser.userId)
    })

    test("returns connected: true when account status is active", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([
            {
                id: "account-123",
                userId: sessionEntityWithUser.userId,
                provider: "oauth-provider",
                providerUserId: "provider-user-123",
                type: "oauth" as const,
                status: "active" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

        const output = await api.isProviderConnected("oauth-provider", {
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.session_token=${sessionToken}`,
            },
        })
        expect(output).toEqual({
            success: true,
            connected: true,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith(sessionEntityWithUser.userId)
    })

    test("returns connected: false when account status is not active", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([
            {
                id: "account-123",
                userId: sessionEntityWithUser.userId,
                provider: "oauth-provider",
                providerUserId: "provider-user-123",
                type: "oauth" as const,
                status: "unlinked" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const tokenHash = await createHash(sessionToken)
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith(sessionEntityWithUser.userId)
    })

    test("toResponse returns correct response when connected", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([
            {
                id: "account-123",
                userId: sessionEntityWithUser.userId,
                provider: "oauth-provider",
                providerUserId: "provider-user-123",
                type: "oauth" as const,
                status: "active" as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
            connected: true,
        })
    })

    test("toResponse returns correct response when not connected", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([])

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)
        const sessionToken = "valid-session-token"

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
        const { api } = authInstance({})
        const output = await api.isProviderConnected("unsupported")

        const response = output.toResponse()
        expect(response.status).toBe(400)

        const json = await response.json()
        expect(json).toEqual({
            success: false,
            connected: false,
        })
    })
})
