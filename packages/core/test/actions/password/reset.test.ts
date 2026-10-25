import { describe, test, expect, vi } from "vitest"
import { createHash, createSecretValue } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { resetPasswordAccountEntity, resetPasswordTokenEntity } from "@test/setup/entities.ts"

describe("resetPasswordAction", async () => {
    test("success resetPassword flow", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("resetPassword with no-existing token", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with no-credentials account", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with expired token", async () => {
        const expiredTokenEntity = {
            ...resetPasswordTokenEntity,
            expiresAt: new Date(Date.now() - 1000),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(expiredTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("resetPassword with revoked token", async () => {
        const revokedTokenEntity = {
            ...resetPasswordTokenEntity,
            revokedAt: new Date(),
        }

        const getTokenByHashMock = vi.fn().mockReturnValue(revokedTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword: "new-password",
                }),
            })
        )

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(updatePasswordHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
    })

    test("success resetPassword flow with redirectTo and redirect: true", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset?redirectTo=/success", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: "new-password" }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })

    test("success resetPassword flow with redirectTo and redirect: false", async () => {
        const getTokenByHashMock = vi.fn().mockReturnValue(resetPasswordTokenEntity)
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([resetPasswordAccountEntity])
        const updatePasswordHashMock = vi.fn()
        const revokeTokenMock = vi.fn()

        const token = createSecretValue()
        const tokenHash = await createHash(token)
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const {
            handlers: { POST },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            updatePasswordHash: updatePasswordHashMock,
            revokeToken: revokeTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/password/reset?redirectTo=/success&redirect=false", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: "new-password" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/success",
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(updatePasswordHashMock).toHaveBeenCalledWith("account-123", expect.any(String))
        expect(revokeTokenMock).toHaveBeenCalledWith("token-123")
    })
})
