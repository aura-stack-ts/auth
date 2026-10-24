import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { verificationTokenEntity } from "@test/setup/entities.ts"

describe("verifyEmail API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success verifyEmail flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = "verification-token-123"
        const tokenHash = await createHash(token)

        const output = await api.verifyEmail(token, {
            headers,
        })

        expect(output).toEqual({
            success: true,
            verified: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("verifyEmail with invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.verifyEmail("invalid-token", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_VERIFICATION_TOKEN",
                message: "Invalid or expired verification token",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with expired token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredToken = {
            ...verificationTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(expiredToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.verifyEmail("expired-token", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_VERIFICATION_TOKEN",
                message: "Invalid or expired verification token",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with revoked token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokedToken = {
            ...verificationTokenEntity,
            revokedAt: new Date(),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(revokedToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.verifyEmail("revoked-token", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_VERIFICATION_TOKEN",
                message: "Invalid or expired verification token",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with wrong token type", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const wrongTypeToken = {
            ...verificationTokenEntity,
            type: "password_reset" as any,
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(wrongTypeToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.verifyEmail("wrong-type-token", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_VERIFICATION_TOKEN",
                message: "Invalid or expired verification token",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with adapter error", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockImplementation(() => {
            throw new Error("Database connection failed")
        })
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.verifyEmail("error-token", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "VERIFY_EMAIL_ERROR",
                message: "An error occurred while verifying the email.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("success verifyEmail with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = "verification-token-123"
        const tokenHash = await createHash(token)

        const output = await api.verifyEmail(token, {
            headers,
            redirect: true,
            redirectTo: "/auth/verified",
        })

        expect(output).toEqual({
            success: true,
            verified: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("success verifyEmail with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = "verification-token-123"
        const tokenHash = await createHash(token)

        const output = await api.verifyEmail(token, {
            headers,
            redirect: false,
            redirectTo: "/auth/verified",
        })

        expect(output).toEqual({
            success: true,
            verified: true,
            redirect: false,
            redirectURL: "/auth/verified",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })
})
