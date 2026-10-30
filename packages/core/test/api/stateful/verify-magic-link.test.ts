import { describe, test, expect, vi } from "vitest"
import { createHash } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { deviceEntity, magicLinkTokenEntity } from "@test/setup/entities.ts"

describe("verifyMagicLink API", async () => {
    test("success with valid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = magicLinkTokenEntity.id
        const tokenHash = await createHash(token)

        const output = await api.verifyMagicLink(token)

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith(token)
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(createAccountMock).toHaveBeenCalledWith({
            userId: "user-123",
            provider: "magic_link",
            status: "active",
            type: "magic_link",
            providerUserId: "user-123",
        })
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-123", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
            authenticatedWith: "magic_link",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
        })
    })

    test("success with existing magic link account", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([{ provider: "magic_link" }])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = magicLinkTokenEntity.id
        const tokenHash = await createHash(token)

        const output = await api.verifyMagicLink(token)

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith(token)
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-123", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
            authenticatedWith: "magic_link",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
        })
    })

    test("failure with invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const revokeTokenMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn()
        const createDeviceMock = vi.fn()
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const output = await api.verifyMagicLink("invalid-token")

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).not.toHaveBeenCalled()
        expect(createDeviceMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("failure with wrong token type", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const wrongTypeToken = {
            ...magicLinkTokenEntity,
            type: "email_verification",
        }
        const getTokenByHashMock = vi.fn().mockReturnValue(wrongTypeToken)
        const revokeTokenMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn()
        const createDeviceMock = vi.fn()
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const output = await api.verifyMagicLink("invalid-token")

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).not.toHaveBeenCalled()
        expect(createDeviceMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("verifyMagicLink with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = magicLinkTokenEntity.id
        const tokenHash = await createHash(token)

        const output = await api.verifyMagicLink(token, {
            redirect: true,
            redirectTo: "https://example.com/dashboard",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith(token)
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(createAccountMock).toHaveBeenCalledWith({
            userId: "user-123",
            provider: "magic_link",
            status: "active",
            type: "magic_link",
            providerUserId: "user-123",
        })
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-123", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
            authenticatedWith: "magic_link",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
        })
    })

    test("verifyMagicLink with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const { api } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = magicLinkTokenEntity.id
        const tokenHash = await createHash(token)

        const output = await api.verifyMagicLink(token, {
            redirect: false,
            redirectTo: "https://example.com/dashboard",
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getTokenByHashMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeTokenMock).toHaveBeenCalledWith(token)
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-123", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-123")
        expect(createAccountMock).toHaveBeenCalledWith({
            userId: "user-123",
            provider: "magic_link",
            status: "active",
            type: "magic_link",
            providerUserId: "user-123",
        })
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-123", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
            authenticatedWith: "magic_link",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
        })
    })
})
