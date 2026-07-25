import { describe, test, expect, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { accountEntity, authInstance, jose, oauthTokens, sessionEntityWithUser, sessionPayload } from "@test/presets.ts"

describe("connectedAction", () => {
    test("throws error when provider is not configured", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const response = await GET(new Request("https://example.com/auth/providers/unsupported", { headers: new Headers() }))
        expect(await response.json()).toEqual({
            code: "UNPROCESSABLE_ENTITY",
            type: "VALIDATION",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })

        expect(response.status).toBe(422)
        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("throws error when session token is missing", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const response = await GET(new Request("https://example.com/auth/providers/oauth-provider", { headers: new Headers() }))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("returns connected: false when provider token cookie does not exist", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)
        getSessionByTokenMock.mockResolvedValueOnce(null)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
    })

    test("returns connected: true when provider token cookie exists and is valid", async () => {
        const getSessionByTokenMock = vi
            .fn()
            .mockResolvedValueOnce(sessionEntityWithUser)
            .mockResolvedValueOnce(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValueOnce([{ ...accountEntity, status: "active" }])

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: true,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith(sessionEntityWithUser.userId)
    })

    test("returns connected: false when provider token cookie is malformed", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash; __Secure-aura-auth.access_token.oauth-provider=invalid-token`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("returns connected: false when provider token cookie is expired", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const expiredTokens = {
            ...oauthTokens,
            exp: Math.floor(Date.now() / 1000) - 3600,
        }
        const encodedExpiredTokens = await jose.encodeJWT(expiredTokens as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash; __Secure-aura-auth.access_token.oauth-provider=${encodedExpiredTokens}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("handles expired session token", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValueOnce([
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

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const expiredSessionPayload = {
            ...sessionPayload,
            exp: Math.floor(Date.now() / 1000) - 3600,
        }
        const expiredSessionToken = await jose.encodeJWT(expiredSessionPayload)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=${expiredSessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("handles empty cookie value", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-provider", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash; __Secure-aura-auth.access_token.oauth-provider=`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("handles multiple providers - checks correct provider", async () => {
        const getSessionByTokenMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()

        getSessionByTokenMock.mockResolvedValueOnce(sessionEntityWithUser)

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
        })

        const csrfToken = await createCSRF(jose)

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const response = await GET(
            new Request("https://example.com/auth/providers/oauth-profile", {
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })
})
