import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { authInstance, jose, sessionEntityWithUser } from "@test/presets.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

vi.mock("@aura-stack/rate-limiter", async () => {
    const actual = await vi.importActual<typeof import("@aura-stack/rate-limiter")>("@aura-stack/rate-limiter")
    return {
        ...actual,
        createRateLimiter: (...args: Parameters<typeof actual.createRateLimiter>) => {
            const limiters = actual.createRateLimiter(...args)

            for (const limiter of Object.values(limiters)) {
                limiter.check = vi.fn().mockResolvedValue({
                    ok: true,
                    limit: Number.MAX_SAFE_INTEGER,
                    remaining: Number.MAX_SAFE_INTEGER,
                    resetAt: Date.now() + 60000,
                    retryAfter: 0,
                    toResponse: () => new Response(),
                })
            }

            return limiters
        },
    }
})

describe("signOut API", async () => {
    const csrfToken = await createCSRF(jose)

    test("invalid session", async () => {
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
                code: "CSRF_TOKEN_MISSING",
                message: "The CSRF token is missing. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

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

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            },
        })
        expect(output).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionTokenMock).toHaveBeenCalledWith("valid-token-hash")
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

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            },
        })
        expect(output).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionTokenMock).toHaveBeenCalledWith("valid-token-hash")
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

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            },
            redirectTo: "/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/dashboard")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionTokenMock).toHaveBeenCalledWith("valid-token-hash")
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

        const output = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
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

        expect(sessionTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
    })
})
