import { describe, test, expect, vi } from "vitest"
import { authInstance } from "@test/setup/auth.ts"
import { userEntity, verificationTokenEntity } from "@test/setup/entities.ts"

describe("sendVerificationEmailAction", async () => {
    test("success sendVerificationEmail flow", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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

    test("sendVerificationEmail with non-existent user", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createTokenMock = vi.fn()

        const {
            handlers: { POST },
        } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
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
        expect(createTokenMock).not.toHaveBeenCalled()
    })

    test("sendVerificationEmail with custom expiresIn", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const {
            handlers: { POST },
        } = authInstance(
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

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
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

    test("sendVerificationEmail with redirectTo and redirect: true", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })

        const response = await POST(
            new Request("https://example.com/auth/emailVerification/send?redirectTo=https://example.com/auth/verify-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: "john@example.com" }),
            })
        )

        expect(response.status).toBe(302)
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
    })

    test("sendVerificationEmail with redirectTo and redirect: false", async () => {
        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createTokenMock = vi.fn().mockReturnValue(verificationTokenEntity)

        const {
            handlers: { POST },
        } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createToken: createTokenMock,
        })
        const response = await POST(
            new Request(
                "https://example.com/auth/emailVerification/send?redirectTo=https://example.com/auth/verify-email&redirect=false",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: "john@example.com" }),
                }
            )
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/auth/verify-email",
        })

        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
    })
})
