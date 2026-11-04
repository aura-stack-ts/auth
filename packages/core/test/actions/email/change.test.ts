import { describe, test, expect, vi } from "vitest"
import { authInstance, jose } from "@test/setup/auth.ts"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { accountEntityWithCredentials, credentialAccountEntity, sessionEntityWithUser, userEntity } from "@test/setup/entities.ts"

describe("changeEmailAction", async () => {
    const csrfToken = await createCSRF(jose)

    test("success changeEmail flow", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const sessionToken = "valid-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "valid-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newEmail: "new@example.com",
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            tokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            token,
            url: `https://example.com/auth/email/change/verify?token=${token}`,
        })
    })

    test("changeEmail with no credentials account", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const getCredentialAccountMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const getUserByEmailMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newEmail: "new@example.com",
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
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("changeEmail with invalid current password", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn()
        const getUserByEmailMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "wrong-password",
                    newEmail: "new@example.com",
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
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("changeEmail with email already registered", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${token}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newEmail: "new@example.com",
                }),
            })
        )

        expect(response.status).toBe(409)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("success changeEmail with redirectTo and redirect: true", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const sessionToken = "valid-session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "valid-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change?redirectTo=/auth/success", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newEmail: "new@example.com",
                }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            tokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            token,
            url: `https://example.com/auth/email/change/verify?token=${token}`,
        })
    })

    test("success changeEmail with redirectTo and redirect: false", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
            {
                getSessionByToken: getSessionByTokenMock,
                getAccountsByUserId: getAccountsByUserIdMock,
                getCredentialAccount: getCredentialAccountMock,
                getUserById: getUserByIdMock,
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailChange: {
                    sendEmailChangeVerification: sendEmailChangeVerificationMock,
                },
            }
        )

        const sessionToken = "valid-session-token"
        const sessionTokenHash = await createHash(sessionToken)

        const token = "valid-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/email/change?redirectTo=/auth/success&redirect=false", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    currentPassword: "current-password",
                    newEmail: "new@example.com",
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/success",
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            tokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            token,
            url: `https://example.com/auth/email/change/verify?token=${token}`,
        })
    })
})
