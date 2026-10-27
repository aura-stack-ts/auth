import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash, createSecretValue } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { emailChangeTokenEntity, sessionEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("verifyEmailChangeAction", async () => {
    const csrfToken = await createCSRF(jose)

    test("success verifyEmailChange flow", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "new@example.com",
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
        expect(revokeAllSessionsMock).toHaveBeenCalledWith("user-123", "email_changed", "session-123")
    })

    test("verifyEmailChange with invalid token", async () => {
        const getSessionByTokenMock = vi.fn().mockReturnValue(null)
        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = "invalid-token"

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "INVALID_VERIFICATION_TOKEN",
            message: "Invalid or expired verification token",
        })

        expect(getSessionByTokenMock).not.toHaveBeenCalled()
        expect(getTokenByHashMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with wrong token type", async () => {
        const wrongTypeToken = {
            ...emailChangeTokenEntity,
            type: "email_verification",
        }

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(wrongTypeToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with expired token", async () => {
        const expiredToken = {
            ...emailChangeTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(expiredToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with revoked token", async () => {
        const revokedToken = {
            ...emailChangeTokenEntity,
            revokedAt: new Date(),
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(revokedToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("verifyEmailChange with null newIdentifier", async () => {
        const nullIdentifierToken = {
            ...emailChangeTokenEntity,
            newIdentifier: null,
        }
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokenByHashMock = vi.fn().mockReturnValue(nullIdentifierToken)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(revokeAllSessionsMock).not.toHaveBeenCalled()
    })

    test("success verifyEmailChange with redirectTo and redirect: true", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}&redirectTo=/auth/success`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "new@example.com",
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
        expect(revokeAllSessionsMock).toHaveBeenCalledWith("user-123", "email_changed", "session-123")
    })

    test("success verifyEmailChange with redirectTo and redirect: false", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const updateUserMock = vi.fn()
        const revokeTokenMock = vi.fn()
        const revokeAllSessionsMock = vi.fn()
        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntity)

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            updateUser: updateUserMock,
            revokeToken: revokeTokenMock,
            revokeAllSessions: revokeAllSessionsMock,
            getSessionByToken: getSessionByTokenMock,
        })

        const token = createSecretValue()
        const tokenHash = await createHash(token)

        const response = await GET(
            new Request(`https://example.com/auth/email/change/verify?token=${token}&redirectTo=/auth/success&redirect=false`, {
                method: "GET",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/success",
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token"))
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "new@example.com",
            emailVerifiedAt: expect.any(Date),
        })
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
        expect(revokeAllSessionsMock).toHaveBeenCalledWith("user-123", "email_changed", "session-123")
    })
})
