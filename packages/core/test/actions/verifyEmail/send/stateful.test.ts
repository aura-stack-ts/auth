import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/exports/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { sessionEntityWithUser, userEntity, verificationTokenEntity } from "@test/setup/entities.ts"

describe("sendVerificationEmailAction", async () => {
    const csrfToken = await createCSRF(jose)

    test("success sendVerificationEmail flow", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendVerificationEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const sessionToken = "session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "verification-token"
        const tokenHash = await createHash(token)

        vi.spyOn(await import("@/exports/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/emailVerification/verify?token=${token}`,
        })
    })

    test("failed sendVerificationEmail callback", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const sendVerificationEmailMock = vi.fn().mockRejectedValue(new Error("Failed to send email"))
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const sessionToken = "session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "verification-token"
        const tokenHash = await createHash(token)

        vi.spyOn(await import("@/exports/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/emailVerification/verify?token=${token}`,
        })
    })

    test("sendVerificationEmail with non-existent user", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(null)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendVerificationEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "nonexistent@example.com" }),
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendVerificationEmailMock).not.toHaveBeenCalled()
    })

    test("sendVerificationEmail with custom expiresIn", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendVerificationEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    expiresIn: 3600,
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const sessionToken = "session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "verification-token"
        const tokenHash = await createHash(token)

        vi.spyOn(await import("@/exports/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/emailVerification/verify?token=${token}`,
        })
    })

    test("sendVerificationEmail with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendVerificationEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const sessionToken = "session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "verification-token"
        const tokenHash = await createHash(token)

        vi.spyOn(await import("@/exports/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send?redirectTo=https://example.com/auth/verify-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/emailVerification/verify?token=${token}`,
        })
    })

    test("sendVerificationEmail with redirectTo and redirect: false", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)
        const sendVerificationEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const sessionToken = "session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "verification-token"
        const tokenHash = await createHash(token)

        vi.spyOn(await import("@/exports/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request(
                "https://example.com/auth/emailVerification/send?redirectTo=https://example.com/auth/verify-email&redirect=false",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                    body: JSON.stringify({ email: "john@example.com" }),
                }
            )
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/verify-email",
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash,
        })
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token,
            url: `https://example.com/auth/emailVerification/verify?token=${token}`,
        })
    })
})
