import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { getSetCookie } from "@/cookie.ts"
import { api, jose } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"
import type { User } from "@/index.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

const payload = {
    name: "johndoe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    password: "1234567890",
}

describe("signUp API", () => {
    test("success signUp flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signUp = await api.signUp({
            payload,
        })
        expect(signUp).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        const decode = await jose.decodeJWT(getSetCookie(signUp.headers, "aura-auth.session_token")!)
        expect(decode).toMatchObject({
            sub: "1234567890",
            email: "john@example.com",
            name: "johndoe",
            image: "https://example.com/image.jpg",
        })
    })

    test("invalid signUp.onCreateUser return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () => null,
            },
        })
        const output = await api.signUp({
            payload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "USER_CREATION_FAILED",
                message: "Failed to create user with the provided payload.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("invalid signUp.onCreateUser by missing required fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as User,
            },
        })
        const output = await api.signUp({
            payload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "INVALID_IDENTITY_VALIDATION_FAILED",
                message: expect.any(String),
            },
            toResponse: expect.any(Function),
        })
    })

    test("signUp without URL configuration", async () => {
        const signUp = await api.signUp({
            payload: {},
        })
        expect(signUp).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "INVALID_OAUTH_CONFIGURATION",
                message:
                    "The URL cannot be constructed. Please set the BASE_URL environment variable or enable trustedProxyHeaders.",
            },
            toResponse: expect.any(Function),
        })
    })

    test("signUp with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            redirect: true,
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
    })

    test("signUp with redirect: true and absolute redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            redirect: true,
            redirectTo: "https://example.com/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/dashboard")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signUp with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            redirect: false,
            redirectTo: "/dashboard",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signUp redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            redirect: true,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signUp redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
