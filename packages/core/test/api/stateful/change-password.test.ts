import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { accountEntityWithCredentials, credentialAccountEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("changePassword API", async () => {
    const csrfToken = await createCSRF(jose)

    test("success changePassword flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "current-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })

    test("changePassword with no credentials account", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const getCredentialAccountMock = vi.fn()
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "current-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "NO_CREDENTIALS_ACCOUNT_FOUND",
                message: "No credential account found for the user. Please contact support.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
    })

    test("changePassword with credential account not found", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(null)
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "current-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "NO_CREDENTIALS_ACCOUNT_FOUND",
                message: "No credential account found for the user. Please contact support.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
    })

    test("changePassword with invalid current password", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "wrong-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_CURRENT_PASSWORD",
                message: "The current password is incorrect. Please try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
    })

    test("success changePassword flow with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "current-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: true,
            redirectTo: "https://example.com/success",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })

    test("success changePassword flow with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const updatePasswordHashMock = vi.fn()

        const { api } = authInstance({
            getAccountsByUserId: getAccountsByUserIdMock,
            getCredentialAccount: getCredentialAccountMock,
            updatePasswordHash: updatePasswordHashMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.changePassword({
            payload: {
                currentPassword: "current-password",
                newPassword: "new-password",
            },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            redirectTo: "https://example.com/success",
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/success",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-321", expect.any(String))
    })
})
