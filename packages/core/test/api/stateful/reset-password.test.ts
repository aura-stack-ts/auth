import { describe, test, expect, vi } from "vitest"
import { createHash } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { resetPasswordAccountEntity, resetPasswordTokenEntity } from "@test/setup/entities.ts"

describe("resetPassword API", async () => {
    test("success resetPassword flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
            },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("resetPassword with no-existing token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_RESET_PASSWORD_TOKEN",
                message: "Invalid or expired password reset token.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with no-credentials account", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
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

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with expired token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredTokenEntity = {
            ...resetPasswordTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(expiredTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_RESET_PASSWORD_TOKEN",
                message: "Invalid or expired password reset token.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with revoked token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokedTokenEntity = {
            ...resetPasswordTokenEntity,
            revokedAt: new Date(),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(revokedTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_RESET_PASSWORD_TOKEN",
                message: "Invalid or expired password reset token.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("success resetPassword flow with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
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

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("success resetPassword flow with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.resetPassword({
            payload: {
                token,
                newPassword: "new-password",
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

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })
})
