import { describe, test, expect, vi } from "vitest"
import { authInstance } from "@test/setup/auth.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import { deviceEntity, magicLinkTokenEntity, userMagicLinkEntity } from "@test/setup/entities.ts"

describe("verifyMagicLinkAction", async () => {
    test("success with valid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const getUserByIdMock = vi.fn().mockReturnValue(userMagicLinkEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            getUserById: getUserByIdMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = createSecretValue()

        const response = await GET(new Request(`https://example.com/auth/signIn/magicLink/verify?token=${token}`))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).toHaveBeenCalledWith("token-101")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-456")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-456", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-456", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-456")
        expect(createAccountMock).toHaveBeenCalledWith({
            userId: "user-456",
            provider: "magic_link",
            status: "active",
            type: "magic_link",
            providerUserId: "user-456",
        })
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-456", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-456",
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
        const getUserByIdMock = vi.fn().mockReturnValue(userMagicLinkEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([{ provider: "magic_link" }])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            getUserById: getUserByIdMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = createSecretValue()

        const response = await GET(new Request(`https://example.com/auth/signIn/magicLink/verify?token=${token}`))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).toHaveBeenCalledWith("token-101")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-456")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-456", "magic_link")
        expect(updateUserMock).toHaveBeenCalledWith("user-456", { emailVerifiedAt: expect.any(Date) })
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-456")
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-456", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalled()
    })

    test("failure with invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(null)
        const revokeTokenMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn()
        const createDeviceMock = vi.fn()
        const createSessionMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            getUserById: getUserByIdMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const response = await GET(new Request("https://example.com/auth/signIn/magicLink/verify?token=invalid-token"))

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "INVALID_VERIFICATION_TOKEN",
            message: "Invalid or expired verification token",
        })

        expect(getTokenByHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
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
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn()
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn()
        const createDeviceMock = vi.fn()
        const createSessionMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            getUserById: getUserByIdMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const response = await GET(new Request("https://example.com/auth/signIn/magicLink/verify?token=invalid-token"))

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "INVALID_VERIFICATION_TOKEN",
            message: "Invalid or expired verification token",
        })

        expect(getTokenByHashMock).not.toHaveBeenCalled()
        expect(revokeTokenMock).not.toHaveBeenCalled()
        expect(getUserByIdMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(getAccountsByUserIdMock).not.toHaveBeenCalled()
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).not.toHaveBeenCalled()
        expect(createDeviceMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("success with redirect query params", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getTokenByHashMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const revokeTokenMock = vi.fn().mockResolvedValue(true)
        const getUserByIdMock = vi.fn().mockReturnValue(userMagicLinkEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const updateUserMock = vi.fn()
        const getAccountsByUserIdMock = vi.fn().mockReturnValue([])
        const createAccountMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn()

        const {
            handlers: { GET },
        } = authInstance({
            getTokenByHash: getTokenByHashMock,
            revokeToken: revokeTokenMock,
            getUserById: getUserByIdMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            updateUser: updateUserMock,
            getAccountsByUserId: getAccountsByUserIdMock,
            createAccount: createAccountMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
        })

        const token = createSecretValue()

        const response = await GET(
            new Request(`https://example.com/auth/signIn/magicLink/verify?token=${token}&redirect=true&redirectTo=/dashboard`)
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getTokenByHashMock).toHaveBeenCalled()
        expect(revokeTokenMock).toHaveBeenCalledWith("token-101")
        expect(getUserByIdMock).toHaveBeenCalledWith("user-456")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-456", "magic_link")
        expect(updateUserMock).toHaveBeenCalled()
        expect(getAccountsByUserIdMock).toHaveBeenCalledWith("user-456")
        expect(createAccountMock).toHaveBeenCalled()
        expect(getDeviceByFingerprintMock).toHaveBeenCalledWith("user-456", expect.any(String))
        expect(createDeviceMock).toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalled()
    })
})
