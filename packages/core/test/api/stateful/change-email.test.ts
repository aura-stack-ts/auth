import { describe, test, expect, vi } from "vitest"
import { authInstance, jose } from "@test/setup/auth.ts"
import { accountEntityWithCredentials, credentialAccountEntity, sessionEntityWithUser, userEntity } from "@test/setup/entities.ts"
import { createCSRF, createHash } from "@/shared/crypto.ts"

describe("changeEmail API", async () => {
    const csrfToken = await createCSRF(jose)

    test("success changeEmail flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const confirmToken = "valid-token"
        const confirmTokenHash = await createHash(confirmToken)

        const cancelToken = "valid-cancel-token"
        const cancelTokenHash = await createHash(cancelToken)

        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue")
            .mockReturnValueOnce(confirmToken)
            .mockReturnValueOnce(cancelToken)

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(createTokenMock).toHaveBeenNthCalledWith(1, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            expiresAt: expect.any(Date),
            tokenHash: confirmTokenHash,
        })
        expect(createTokenMock).toHaveBeenNthCalledWith(2, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change_cancel",
            expiresAt: expect.any(Date),
            tokenHash: cancelTokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            confirmToken: confirmToken,
            confirmURL: `https://example.com/auth/email/change/verify?token=${confirmToken}`,
            cancelToken: cancelToken,
            cancelURL: `https://example.com/auth/email/change/cancel?token=${cancelToken}`,
        })
    })

    test("changeEmail with no credentials account", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const getCredentialAccountMock = vi.fn()
        const getUserByIdMock = vi.fn()
        const getUserByEmailMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
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

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("changeEmail with invalid current password", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn()
        const getUserByEmailMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const output = await api.changeEmail({
            payload: {
                currentPassword: "wrong-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
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

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("changeEmail with email already registered", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "EMAIL_ALREADY_REGISTERED",
                message: "This email address is already registered. Please sign in or use a different email.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("changeEmail with user not found", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const getUserByEmailMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "USER_NOT_FOUND",
                message: "User not found. Please check the user ID and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendEmailChangeVerificationMock).not.toHaveBeenCalled()
    })

    test("success changeEmail flow with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const confirmToken = "valid-token"
        const confirmTokenHash = await createHash(confirmToken)

        const cancelToken = "valid-cancel-token"
        const cancelTokenHash = await createHash(cancelToken)

        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue")
            .mockReturnValueOnce(confirmToken)
            .mockReturnValueOnce(cancelToken)

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
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

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).toHaveBeenNthCalledWith(1, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            expiresAt: expect.any(Date),
            tokenHash: confirmTokenHash,
        })
        expect(createTokenMock).toHaveBeenNthCalledWith(2, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change_cancel",
            expiresAt: expect.any(Date),
            tokenHash: cancelTokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            confirmToken: confirmToken,
            confirmURL: `https://example.com/auth/email/change/verify?token=${confirmToken}`,
            cancelToken: cancelToken,
            cancelURL: `https://example.com/auth/email/change/cancel?token=${cancelToken}`,
        })
    })

    test("success changeEmail flow with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([accountEntityWithCredentials])
        const getCredentialAccountMock = vi.fn().mockReturnValue(credentialAccountEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()
        const sendEmailChangeVerificationMock = vi.fn()

        const { api } = authInstance(
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

        const confirmToken = "valid-token"
        const confirmTokenHash = await createHash(confirmToken)

        const cancelToken = "valid-cancel-token"
        const cancelTokenHash = await createHash(cancelToken)

        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue")
            .mockReturnValueOnce(confirmToken)
            .mockReturnValueOnce(cancelToken)

        const output = await api.changeEmail({
            payload: {
                currentPassword: "current-password",
                newEmail: "new@example.com",
            },
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
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

        expect(getSessionByTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(getCredentialAccountMock).toHaveBeenCalledWith("account-321")
        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createTokenMock).toHaveBeenNthCalledWith(1, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change",
            expiresAt: expect.any(Date),
            tokenHash: confirmTokenHash,
        })
        expect(createTokenMock).toHaveBeenNthCalledWith(2, {
            userId: "user-123",
            identifier: "john@example.com",
            newIdentifier: "new@example.com",
            type: "email_change_cancel",
            expiresAt: expect.any(Date),
            tokenHash: cancelTokenHash,
        })
        expect(sendEmailChangeVerificationMock).toHaveBeenCalledWith({
            email: "john@example.com",
            newEmail: "new@example.com",
            confirmToken: confirmToken,
            confirmURL: `https://example.com/auth/email/change/verify?token=${confirmToken}`,
            cancelToken: cancelToken,
            cancelURL: `https://example.com/auth/email/change/cancel?token=${cancelToken}`,
        })
    })
})
