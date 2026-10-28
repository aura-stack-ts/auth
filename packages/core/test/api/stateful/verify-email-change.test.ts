import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { emailChangeTokenEntity, sessionEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("verifyEmailChange API", async () => {
    const csrfToken = await createCSRF(jose)

    test("success verifyEmailChange flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)
        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.verifyEmailChange({
            payload: { token },
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

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "new@example.com",
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
        expect(revokeAllSessionsMock).toHaveBeenCalledWith("user-123", "email_changed", "session-123")
    })

    test("verifyEmailChange with invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(null)
        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "invalid-token"
        const tokenHash = await createHash(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with revoked verification token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokedToken = {
            ...emailChangeTokenEntity,
            revokedAt: new Date(Date.now() - 1000),
        }

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(revokedToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "invalid-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with wrong token type", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const wrongTypeToken = {
            ...emailChangeTokenEntity,
            type: "email_verification",
        }

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)
        const getTokenByHashMock = vi.fn().mockReturnValue(wrongTypeToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with expired token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const expiredToken = {
            ...emailChangeTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)
        const getTokenByHashMock = vi.fn().mockReturnValue(expiredToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with revoked token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokedToken = {
            ...emailChangeTokenEntity,
            revokedAt: new Date(),
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)
        const getTokenByHashMock = vi.fn().mockReturnValue(revokedToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "mocked-token"
        const tokenHash = await createHash(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with null newIdentifier", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const nullIdentifierToken = {
            ...emailChangeTokenEntity,
            newIdentifier: null,
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)
        const getTokenByHashMock = vi.fn().mockReturnValue(nullIdentifierToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "mocked-token"
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.verifyEmailChange({
            payload: { token },
            headers: {
                Cookie: `aura-auth.session_token=${token}; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: false,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })
})
