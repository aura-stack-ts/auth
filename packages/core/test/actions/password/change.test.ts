import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { accountEntityWithCredentials, credentialAccountEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("changePasswordAction", async () => {
    const csrfToken = await createCSRF(jose)

    test("success changePassword flow", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/password/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })

    test("changePassword with no credentials account", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const getCredentialAccountMock = vi.fn()
        const updatePasswordHashMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/password/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
    })

    test("changePassword with invalid current password", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/password/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "wrong-password",
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
    })

    test("success changePassword with redirectTo and redirect: true", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/password/change?redirectTo=/auth/success", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })

    test("success changePassword with redirectTo and redirect: false", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/password/change?redirectTo=/auth/success&redirect=false", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/success",
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })
})
