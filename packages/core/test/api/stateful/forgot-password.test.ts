import { describe, test, expect, vi } from "vitest"
import { createHash } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { userEntity, verificationTokenEntity } from "@test/setup/entities.ts"

describe("forgotPassword API", async () => {
    test("success forgotPassword flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                passwordReset: {
                    sendPasswordResetEmail: sendPasswordResetEmailMock,
                },
            }
        )

        const output = await api.forgotPassword("john@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "password_reset",
            tokenHash,
        })
        expect(sendPasswordResetEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/password/reset?token=${token}`,
        })
    })

    test("forgotPassword with non-existing email", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendPasswordResetEmailMock = vi.fn()

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                passwordReset: {
                    sendPasswordResetEmail: sendPasswordResetEmailMock,
                },
            }
        )

        const output = await api.forgotPassword("nonexistent@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("nonexistent@example.com")
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendPasswordResetEmailMock).toHaveBeenCalled()
    })

    test("forgotPassword with custom expiresIn", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn()
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                passwordReset: {
                    expiresIn: 3600,
                    sendPasswordResetEmail: sendPasswordResetEmailMock,
                },
            }
        )
        const output = await api.forgotPassword("john@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "password_reset",
            tokenHash,
        })
    })

    test("success forgotPassword with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                passwordReset: {
                    sendPasswordResetEmail: sendPasswordResetEmailMock,
                },
            }
        )

        const output = await api.forgotPassword("john@example.com", {
            redirect: true,
            redirectTo: "/auth/password-reset",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "password_reset",
            tokenHash,
        })
        expect(sendPasswordResetEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/password/reset?token=${token}`,
        })
    })

    test("success forgotPassword with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                passwordReset: {
                    sendPasswordResetEmail: sendPasswordResetEmailMock,
                },
            }
        )

        const output = await api.forgotPassword("john@example.com", {
            redirect: false,
            redirectTo: "/auth/password-reset",
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/password-reset",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "password_reset",
            tokenHash,
        })
        expect(sendPasswordResetEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/password/reset?token=${token}`,
        })
    })
})
