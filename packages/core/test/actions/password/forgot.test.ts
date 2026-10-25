import { describe, test, expect, vi } from "vitest"
import { createHash } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { userEntity, verificationTokenEntity } from "@test/setup/entities.ts"

describe("forgotPasswordAction", async () => {
    test("success forgotPassword flow", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/password/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendPasswordResetEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/password/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "nonexistent@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("nonexistent@example.com")
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendPasswordResetEmailMock).toHaveBeenCalled()
    })

    test("forgotPassword with custom expiresIn", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn()
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance(
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
        const response = await POST(
            new Request("https://example.com/auth/password/forgot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/password/forgot?redirectTo=/auth/password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
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
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendPasswordResetEmailMock = vi.fn()

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/password/forgot?redirectTo=/auth/password-reset&redirect=false", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/password-reset",
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
