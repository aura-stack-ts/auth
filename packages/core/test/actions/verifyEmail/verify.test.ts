import { describe, test, expect, vi } from "vitest"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { verificationTokenEntity } from "@test/setup/entities.ts"

describe("verifyEmailAction", async () => {
    test("success verifyEmail flow", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/emailVerification/verify?token=${token}`, {
                method: "GET",
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            verified: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("verifyEmail with invalid token", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const response = await GET(
            new Request("https://example.com/auth/emailVerification/verify?token=invalid-token", {
                method: "GET",
            })
        )

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "INVALID_VERIFICATION_TOKEN",
            message: "Invalid or expired verification token",
        })

        expect(getTokenByHashMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with expired token", async () => {
        const expiredToken = {
            ...verificationTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(expiredToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const output = await GET(
            new Request(`https://example.com/auth/emailVerification/verify?token=${token}`, {
                method: "GET",
            })
        )

        expect(output.status).toBe(400)
        expect(await output.json()).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with revoked token", async () => {
        const revokedToken = {
            ...verificationTokenEntity,
            revokedAt: new Date(),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(revokedToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const output = await GET(
            new Request(`https://example.com/auth/emailVerification/verify?token=${token}`, {
                method: "GET",
            })
        )

        expect(output.status).toBe(400)
        expect(await output.json()).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("verifyEmail with wrong token type", async () => {
        const wrongTypeToken = {
            ...verificationTokenEntity,
            type: "password_reset" as any,
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(wrongTypeToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const response = await GET(
            new Request(`https://example.com/auth/emailVerification/verify?token=${token}`, {
                method: "GET",
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            verified: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("success verifyEmail with redirectTo and redirect: true", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/emailVerification/verify?token=${token}&redirectTo=/auth/verified`, {
                method: "GET",
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            verified: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("success verifyEmail with redirectTo and redirect: false", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(
                `https://example.com/auth/emailVerification/verify?token=${token}&redirectTo=/auth/verified&redirect=false`,
                {
                    method: "GET",
                }
            )
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            verified: true,
            redirect: false,
            redirectURL: "/auth/verified",
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })
})
