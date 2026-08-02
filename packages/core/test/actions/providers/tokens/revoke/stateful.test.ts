import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import {
    accountEntity,
    authInstance,
    jose,
    oauthAccountEntity,
    oauthCustomService,
    oauthTokens,
    sessionEntityWithUser,
} from "@test/presets.ts"

describe("Revoke Action", () => {
    test("throws error when provider is not configured", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/providers/unsupported/tokens/revoke", {
                method: "POST",
                headers: new Headers(),
            })
        )
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

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when session token is missing", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: new Headers(),
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is missing", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalled()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when CSRF token is invalid", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                    "X-CSRF-Token": "invalid-token",
                },
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalledOnce()
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when provider token cookie does not exist", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })

        const tokenHash = await createHash("valid-token-hash")
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("throws error when provider does not have revoke token configured", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValueOnce(sessionEntityWithUser)
        const getOAuthAccountMock = vi.fn()
        const updateAccountStatusMock = vi.fn()

        const { revokeToken: _, ...spread } = oauthCustomService

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getOAuthAccount: getOAuthAccountMock,
                updateAccountStatus: updateAccountStatusMock,
            },
            { oauth: [spread] }
        )

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("successfully revokes token", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
        })

        const setCookieHeader = response.headers.get("set-cookie")
        expect(setCookieHeader).toContain("aura-auth.access_token.oauth-provider=")
        expect(setCookieHeader).toContain("Expires=")

        expect(mockFetch).toHaveBeenCalledWith("https://example.com/oauth/revoke_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: expect.stringContaining("Basic"),
            },
            body: expect.any(URLSearchParams),
            signal: expect.any(AbortSignal),
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
    })

    test("successfully revokes token with 204 status", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 204,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ success: true })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
    })

    test("handles network error during revocation", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const encodedTokens = await jose.encodeJWT(oauthTokens as unknown as Record<string, unknown>)

        const mockFetch = vi.fn().mockRejectedValueOnce(new Error("Network connection lost"))
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash; __Secure-aura-auth.access_token.oauth-provider=${encodedTokens}`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider returning error response", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)

        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 400,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })

        const tokenHash = await createHash("valid-token-hash")
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider returning unexpected status code", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)
        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")
        const mockFetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            status: 201,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles malformed provider token cookie", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)
        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles expired session token", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            expiresAt: new Date(Date.now() - 3600 * 1000),
        })
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getOAuthAccount: getOAuthAccountMock,
            updateAccountStatus: updateAccountStatusMock,
        })

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: false })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getOAuthAccountMock).not.toHaveBeenCalled()
        expect(updateAccountStatusMock).not.toHaveBeenCalled()
    })

    test("handles provider with custom revoke token URL", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

        const customRevokeService = {
            ...oauthCustomService,
            revokeToken: "https://custom.example.com/revoke",
        }

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getOAuthAccount: getOAuthAccountMock,
                updateAccountStatus: updateAccountStatusMock,
            },
            { oauth: [customRevokeService] }
        )

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({ success: true })
        expect(mockFetch).toHaveBeenCalledWith("https://custom.example.com/revoke", expect.any(Object))

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")
    })

    test("handles provider with custom revoke token config object", async () => {
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockResolvedValue([accountEntity])
        const getOAuthAccountMock = vi.fn().mockResolvedValue(oauthAccountEntity)
        const updateAccountStatusMock = vi.fn().mockResolvedValue(accountEntity)

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

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getOAuthAccount: getOAuthAccountMock,
                updateAccountStatus: updateAccountStatusMock,
            },
            { oauth: [customRevokeService] }
        )

        const csrfToken = await createCSRF(jose)
        const tokenHash = await createHash("valid-token-hash")

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({ "Content-Type": "application/json" }),
            status: 200,
        })
        vi.stubGlobal("fetch", mockFetch)

        const response = await POST(
            new Request("https://example.com/auth/providers/oauth-provider/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )

        expect(await response.json()).toEqual({
            success: true,
        })
        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getOAuthAccountMock).toHaveBeenCalledWith("account-123")
        expect(updateAccountStatusMock).toHaveBeenCalledWith("account-123", "unlinked")

        expect(mockFetch).toHaveBeenCalled()
        expect(mockFetch).toHaveBeenCalledWith(
            "https://custom.example.com/revoke",
            expect.objectContaining({
                method: "POST",
                body: expect.any(URLSearchParams),
                headers: {
                    Authorization: expect.stringContaining("Basic"),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Custom-Header": "custom-value",
                },
                signal: expect.any(AbortSignal),
            })
        )
    })
})
