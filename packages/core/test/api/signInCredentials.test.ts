import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { getSetCookie } from "@/cookie.ts"
import { api, jose } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
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

describe("signInCredentials API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signIn flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(signIn).toEqual({
            success: true,
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            toResponse: expect.any(Function),
        })
        const decoded = await jose.decodeJWT(getSetCookie(signIn.headers, "aura-auth.session_token")!)
        expect(decoded).toMatchObject({
            sub: "1234567890",
            email: "johndoe@example.com",
            name: "johndoe",
            image: "https://example.com/image.jpg",
        })
    })

    test("invalid authorize return", async () => {
        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: () => null,
            },
        })
        const { success } = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "wrongpassword",
            },
        })
        expect(success).toBe(false)
    })

    test("invalid authorize by missing required fields", async () => {
        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as any,
            },
        })
        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(signIn).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "INVALID_AUTH_CONFIGURATION",
                message: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
            },
            toResponse: expect.any(Function),
        })
    })

    test("simulate hashing and verification", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            oauth: [],
            credentials: {
                authorize: async (ctx) => {
                    // Simulate password hashing and verification
                    const hash = await ctx.deriveSecret(ctx.credentials.password, "salt")
                    const isVerified = await ctx.verifySecret(ctx.credentials.password, hash)
                    if (!isVerified) return null
                    return {
                        sub: "1234567890-abcdef",
                        name: ctx.credentials.username,
                    }
                },
            },
        })
        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(signIn).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        const decoded = await jose.decodeJWT(getSetCookie(signIn.headers, "aura-auth.session_token")!)
        expect(decoded).toMatchObject({
            sub: "1234567890-abcdef",
            name: "johndoe",
        })
    })

    test("signIn without URL configuration", async () => {
        const { success } = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(success).toBe(false)
    })

    test("signIn with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: true,
            redirectTo: "https://example.com/dashboard",
        })

        expect(signIn.headers.get("Location")).toBe("/dashboard")
        expect(signIn).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signIn with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://example.com/dashboard",
        })
        expect(signIn).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signIn redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: true,
            redirectTo: "https://malicious.com/phishing",
        })
        expect(signIn.headers.get("Location")).toBe("/")
        expect(signIn).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signIn with redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signIn = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://malicious.com/phishing",
        })
        expect(signIn.headers.get("Location")).toBeNull()
        expect(signIn).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
