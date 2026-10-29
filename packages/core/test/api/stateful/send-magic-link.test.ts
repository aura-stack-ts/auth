import { describe, test, expect, vi } from "vitest"
import { authInstance } from "@test/setup/auth.ts"
import { magicLinkTokenEntity, userEntity } from "@test/setup/entities.ts"

describe("sendMagicLink API", async () => {
    test("success with existing user", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                revokeAllVerificationTokens: revokeAllVerificationTokensMock,
                createToken: createTokenMock,
            },
            {
                magicLinks: {
                    sendMagicLinkEmail: sendMagicLinkEmailMock,
                },
            }
        )

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.sendMagicLink("user@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("user@example.com")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(createTokenMock).toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).toHaveBeenCalledWith({
            email: "user@example.com",
            token,
            url: `https://example.com/auth/signIn/magicLink/verify?token=${token}`,
        })
    })

    test("success with allowSignUp and new user", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createUser: createUserMock,
                revokeAllVerificationTokens: revokeAllVerificationTokensMock,
                createToken: createTokenMock,
            },
            {
                magicLinks: {
                    allowSignUp: true,
                    sendMagicLinkEmail: sendMagicLinkEmailMock,
                },
            }
        )

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.sendMagicLink("new@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("new@example.com")
        expect(createUserMock).toHaveBeenCalled()
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(createTokenMock).toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).toHaveBeenCalledWith({
            email: "new@example.com",
            token,
            url: `https://example.com/auth/signIn/magicLink/verify?token=${token}`,
        })
    })

    test("failure with non-existent user and no allowSignUp", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn()
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn()
        const sendMagicLinkEmailMock = vi.fn()

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createUser: createUserMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            createToken: createTokenMock,
        })

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.sendMagicLink("nonexistent@example.com")

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("nonexistent@example.com")
        expect(createUserMock).not.toHaveBeenCalled()
        expect(revokeAllVerificationTokensMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).not.toHaveBeenCalled()
    })

    test("success with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                revokeAllVerificationTokens: revokeAllVerificationTokensMock,
                createToken: createTokenMock,
            },
            {
                magicLinks: {
                    sendMagicLinkEmail: sendMagicLinkEmailMock,
                },
            }
        )

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.sendMagicLink("user@example.com", {
            redirect: true,
            redirectTo: "https://example.com/check-email",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("user@example.com")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(createTokenMock).toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).toHaveBeenCalledWith({
            email: "user@example.com",
            token,
            url: `https://example.com/auth/signIn/magicLink/verify?token=${token}`,
        })
    })

    test("success with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                revokeAllVerificationTokens: revokeAllVerificationTokensMock,
                createToken: createTokenMock,
            },
            {
                magicLinks: {
                    sendMagicLinkEmail: sendMagicLinkEmailMock,
                },
            }
        )

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const output = await api.sendMagicLink("user@example.com", {
            redirect: false,
            redirectTo: "https://example.com/check-email",
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/check-email",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("user@example.com")
        expect(revokeAllVerificationTokensMock).toHaveBeenCalledWith("user-123", "magic_link")
        expect(createTokenMock).toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).toHaveBeenCalledWith({
            email: "user@example.com",
            token,
            url: `https://example.com/auth/signIn/magicLink/verify?token=${token}`,
        })
    })
})
