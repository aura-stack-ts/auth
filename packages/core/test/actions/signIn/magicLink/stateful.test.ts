import { describe, test, expect, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { authInstance, jose } from "@test/setup/auth.ts"
import { magicLinkTokenEntity, userEntity } from "@test/setup/entities.ts"

describe("sendMagicLinkAction", async () => {
    const csrfToken = await createCSRF(jose)

    test("success with existing user", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/signIn/magicLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ email: "user@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/signIn/magicLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ email: "new@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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

        const {
            handlers: { POST },
        } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createUser: createUserMock,
            revokeAllVerificationTokens: revokeAllVerificationTokensMock,
            createToken: createTokenMock,
        })

        const token = "mocked-magic-link-token"
        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue(token)

        const response = await POST(
            new Request("https://example.com/auth/signIn/magicLink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ email: "nonexistent@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("nonexistent@example.com")
        expect(createUserMock).not.toHaveBeenCalled()
        expect(revokeAllVerificationTokensMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
        expect(sendMagicLinkEmailMock).not.toHaveBeenCalled()
    })

    test("success with redirect query params", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const revokeAllVerificationTokensMock = vi.fn()
        const createTokenMock = vi.fn().mockReturnValue(magicLinkTokenEntity)
        const sendMagicLinkEmailMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/signIn/magicLink?redirect=true&redirectTo=/check-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                },
                body: JSON.stringify({ email: "user@example.com" }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
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
