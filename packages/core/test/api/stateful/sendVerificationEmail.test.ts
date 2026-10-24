import { describe, test, expect, vi } from "vitest"
import { jose } from "@test/setup/auth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { userEntity, verificationTokenEntity } from "@test/setup/entities.ts"

describe("sendVerificationEmail API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success sendVerificationEmail flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash: expect.any(String),
        })
    })

    test("success sendVerificationEmail flow with emailVerification.sendVerificationEmail callback", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sendVerificationEmailMock = vi.fn()
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        vi.spyOn(await import("@/shared/crypto.ts"), "createSecretValue").mockReturnValue("mocked-token")

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    sendVerificationEmail: sendVerificationEmailMock,
                },
            }
        )

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash: expect.any(String),
        })

        expect(sendVerificationEmailMock).toHaveBeenCalledOnce()
        expect(sendVerificationEmailMock).toHaveBeenCalledWith({
            email: "john@example.com",
            token: "mocked-token",
            url: "https://example.com/auth/emailVerification/verify?token=mocked-token",
        })
    })

    test("sendVerificationEmail with non-existent user", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const output = await api.sendVerificationEmail("nonexistent@example.com", {
            headers,
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("nonexistent@example.com")
        expect(createTokenMock).not.toHaveBeenCalled()
    })

    test("sendVerificationEmail with custom expiresIn", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createToken: createTokenMock,
            },
            {
                emailVerification: {
                    expiresIn: 3600,
                },
            }
        )

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createTokenMock).toHaveBeenCalledWith({
            userId: "user-123",
            expiresAt: expect.any(Date),
            identifier: "john@example.com",
            newIdentifier: null,
            type: "email_verification",
            tokenHash: expect.any(String),
        })
    })

    test("sendVerificationEmail without URL configuration", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn()

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_AUTH_CONFIGURATION",
                message: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).not.toHaveBeenCalled()
        expect(createTokenMock).not.toHaveBeenCalled()
    })

    test("sendVerificationEmail with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
            redirectTo: "https://example.com/auth/verify-email",
        })

        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
    })

    test("sendVerificationEmail with redirectTo and redirect: false", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const output = await api.sendVerificationEmail("john@example.com", {
            headers,
            redirectTo: "https://example.com/auth/verify-email",
            redirect: false,
        })

        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/verify-email",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
    })
})
