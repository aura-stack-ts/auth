import { describe, expect, test, vi } from "vitest"
import { createCSRF, createHash } from "@/exports/crypto.ts"
import { sessionEntityWithUser } from "@test/setup/entities.ts"
import { authInstance, jose } from "@test/setup/auth.ts"

describe("signOut API", async () => {
    const csrfToken = await createCSRF(jose)

    test("invalid session", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokeSessionMock = vi.fn()
        const sessionTokenMock = vi.fn().mockResolvedValue(null)

        const { api } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionTokenMock,
        })

        const output = await api.signOut({
            headers: new Headers(),
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])

        expect(sessionTokenMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
    })

    test("signOut with valid session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokeSessionMock = vi.fn()
        const sessionTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionTokenMock,
        })
        const sessionToken = "valid-token-hash"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
            },
        })
        expect(output).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: "",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        expect(sessionTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
    })

    test("signOut with baseURL from createAuth config", async () => {
        const revokeSessionMock = vi.fn()
        const sessionTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance(
            {
                revokeSession: revokeSessionMock,
                getSessionByToken: sessionTokenMock,
            },
            { baseURL: "http://localhost:3000" }
        )
        const sessionToken = "valid-token-hash"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })
        expect(output).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: "",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        expect(sessionTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
    })

    test("signOut with redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokeSessionMock = vi.fn()
        const sessionTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionTokenMock,
        })
        const sessionToken = "valid-token-hash"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirectTo: "/dashboard",
        })
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders({
            location: "/dashboard",
        })
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: "",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        expect(sessionTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
    })

    test("signOut with redirect: false and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const revokeSessionMock = vi.fn()
        const sessionTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionTokenMock,
        })
        const sessionToken = "valid-token-hash"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            redirectTo: "/dashboard",
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: "",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        expect(sessionTokenMock).toHaveBeenCalledWith(sessionTokenHash)
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
    })
})
