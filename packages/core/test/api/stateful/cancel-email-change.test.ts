import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { emailChangeTokenEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("cancelEmailChange API", async () => {
    const csrfToken = await createCSRF(jose)

    test("token-based flow: success", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.cancelEmailChange({
            payload: { token },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
    })

    test("token-based flow: invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.cancelEmailChange({
            payload: { token: "invalid-token" },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_EMAIL_CHANGE_TOKEN",
                message: "Invalid or expired email change token.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("in-app flow: success", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeTokenEntity])
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokensByUserId: getTokensByUserIdMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.cancelEmailChange({
            headers: {
                Cookie: `aura-auth.session_token=valid-token; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
    })

    test("in-app flow: no pending email change", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokensByUserIdMock = vi.fn().mockReturnValue([])
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokensByUserId: getTokensByUserIdMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.cancelEmailChange({
            headers: {
                Cookie: `aura-auth.session_token=valid-token; aura-auth.csrf_token=${csrfToken}`,
            },
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("in-app flow with redirect", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeTokenEntity])
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            getTokensByUserId: getTokensByUserIdMock,
            revokeToken: revokeTokenMock,
        })

        const output = await api.cancelEmailChange({
            headers: {
                Cookie: `aura-auth.session_token=valid-token; aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: true,
            redirectTo: "https://example.com/settings",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
    })

    test("token-based flow: success with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.cancelEmailChange({
            payload: { token },
            redirect: false,
            redirectTo: "https://example.com/settings",
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/settings",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
    })

    test("token-based flow: success with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeTokenEntity)
        const revokeTokenMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
        })

        const token = "valid-token"
        const tokenHash = await createHash(token)

        const output = await api.cancelEmailChange({
            payload: { token },
            redirect: true,
            redirectTo: "https://example.com/settings",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith("token-456")
    })
})
