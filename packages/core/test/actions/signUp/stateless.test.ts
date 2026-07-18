import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { z } from "zod/v4"
import { jose, POST } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { getSetCookie } from "@/cookie.ts"
import { identitySchema } from "@/identity/zod.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

const payload = {
    name: "johndoe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    password: "1234567890",
}

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

describe("signUp API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; Secure; HttpOnly; SameSite=Strict; Path=/`,
    }

    test("success signUp flow", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("invalid signUp.onCreateUser return", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () => null,
            },
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("invalid signUp.onCreateUser return with custom schema", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string(),
                }),
                onCreateUser: () => null,
            },
        })
        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                email: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })

    test("valid signUp.onCreateUser return with custom schema", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string(),
                }),
                onCreateUser: ({ payload }) => ({
                    sub: "1234567890",
                    email: payload.email,
                    name: payload.name,
                    image: "https://example.com/image.jpg",
                }),
            },
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("valid signUp.onCreateUser return with custom schema and identity.schema", async () => {
        const { handlers } = createAuth({
            oauth: [],
            identity: {
                // @ts-ignore @todo fix this type issue
                schema: identitySchema.extend({
                    role: z.string(),
                }),
            },
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string(),
                }),
                onCreateUser: ({ payload }) => ({
                    sub: "1234567890",
                    email: payload.email,
                    name: payload.name,
                    image: "https://example.com/image.jpg",
                    role: "user",
                }),
            },
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            role: "user",
        })
    })

    test("signUp with redirect: true and redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("signUp with redirect: false", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("signUp with redirect: false and redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("signUp with redirect: true and invalid redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=http://malicious.com", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })

    test("signUp with redirect: false and invalid redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=http://malicious.com", {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
        })
        const decodedToken = await jose.decodeJWT(getSetCookie(response, "__Secure-aura-auth.session_token")!)
        expect(decodedToken).toMatchObject({
            sub: "1234567890",
            name: "johndoe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
    })
})
