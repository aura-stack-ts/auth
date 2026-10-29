import { describe, test, expect, vi } from "vitest"
import { createCSRF, createHash, createSecretValue } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { emailChangeCancelTokenEntity, sessionEntityWithUser } from "@test/setup/entities.ts"

describe("cancelEmailChangeAction", async () => {
    const csrfToken = await createCSRF(jose)

    describe("token-based flow", () => {
        test("token-based flow: success", async () => {
            const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeCancelTokenEntity)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getTokenByHash: getTokenByHashMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const token = createSecretValue()
            const tokenHash = await createHash(token)

            const response = await GET(new Request(`https://example.com/auth/email/change/cancel?token=${token}`))

            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
            })

            expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
            expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })

        test("token-based flow: invalid token", async () => {
            const getTokenByHashMock = vi.fn().mockReturnValue(null)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getTokenByHash: getTokenByHashMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const token = "invalid-token"

            const response = await GET(new Request(`https://example.com/auth/email/change/cancel?token=${token}`))

            expect(response.status).toBe(422)
            expect(await response.json()).toEqual({
                type: "VALIDATION",
                code: "INVALID_VERIFICATION_TOKEN",
                message: "Invalid or expired verification token",
            })

            expect(getTokenByHashMock).not.toHaveBeenCalled()
            expect(getTokensByUserIdMock).not.toHaveBeenCalled()
            expect(revokeTokenMock).not.toHaveBeenCalled()
        })

        test("token-based flow with redirectTo and redirect=true", async () => {
            const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeCancelTokenEntity)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getTokenByHash: getTokenByHashMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const token = createSecretValue()
            const tokenHash = await createHash(token)

            const response = await GET(
                new Request(`https://example.com/auth/email/change/cancel?token=${token}&redirectTo=/settings&redirect=true`, {
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: "__Host-aura-auth.csrf_token=${csrfToken}",
                    },
                })
            )

            expect(response.status).toBe(302)
            expect(await response.json()).toEqual({
                success: true,
                redirect: true,
                redirectURL: null,
            })

            expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })

        test("token-based flow with redirectTo and redirect=false", async () => {
            const getTokenByHashMock = vi.fn().mockReturnValue(emailChangeCancelTokenEntity)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getTokenByHash: getTokenByHashMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const token = createSecretValue()
            const tokenHash = await createHash(token)

            const response = await GET(
                new Request(`https://example.com/auth/email/change/cancel?token=${token}&redirectTo=/settings&redirect=false`, {
                    method: "GET",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: "__Host-aura-auth.csrf_token=${csrfToken}",
                    },
                })
            )

            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: "/settings",
            })

            expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })
    })

    describe("in-app flow", () => {
        test("in-app flow: success", async () => {
            const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getSessionByToken: getSessionByTokenMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const response = await GET(
                new Request("https://example.com/auth/email/change/cancel", {
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

            expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })

        test("in-app flow with missing csrf token", async () => {
            const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getSessionByToken: getSessionByTokenMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const response = await GET(
                new Request("https://example.com/auth/email/change/cancel", {
                    method: "GET",
                    headers: {
                        Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
            )

            expect(response.status).toBe(403)
            expect(await response.json()).toEqual({
                success: false,
                redirect: false,
                redirectURL: null,
            })

            expect(getTokensByUserIdMock).not.toHaveBeenCalled()
            expect(revokeTokenMock).not.toHaveBeenCalled()
        })

        test("in-app flow: no pending email change", async () => {
            const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getSessionByToken: getSessionByTokenMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const response = await GET(
                new Request("https://example.com/auth/email/change/cancel", {
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

            expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
            expect(revokeTokenMock).not.toHaveBeenCalled()
        })

        test("in-app flow with redirectTo and redirect=true", async () => {
            const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getSessionByToken: getSessionByTokenMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const response = await GET(
                new Request("https://example.com/auth/email/change/cancel?redirectTo=/settings&redirect=true", {
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

            expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })

        test("in-app flow with redirectTo and redirect=false", async () => {
            const getSessionByTokenMock = vi.fn().mockReturnValue(sessionEntityWithUser)
            const getTokensByUserIdMock = vi.fn().mockReturnValue([emailChangeCancelTokenEntity])
            const revokeTokenMock = vi.fn()

            const {
                handlers: { GET },
            } = authInstance({
                getSessionByToken: getSessionByTokenMock,
                getTokensByUserId: getTokensByUserIdMock,
                revokeToken: revokeTokenMock,
            })

            const response = await GET(
                new Request("https://example.com/auth/email/change/cancel?redirectTo=/settings&redirect=false", {
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
                redirectURL: "/settings",
            })

            expect(getTokensByUserIdMock).toHaveBeenCalledWith("user-123")
            expect(revokeTokenMock).toHaveBeenCalledWith("token-789")
        })
    })
})
