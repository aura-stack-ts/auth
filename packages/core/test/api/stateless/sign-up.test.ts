import { describe, test, expect, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/setup/auth.ts"
import { createCSRF } from "@/exports/crypto.ts"
import type { User } from "@/index.ts"

const payload = {
    name: "johndoe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    password: "1234567890",
}

describe("signUp API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signUp flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers: { ...headers, "Set-Cookie": "initial-provider-cookie=initial; Path=/" },
            payload,
        })
        expect(output).toEqual({
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
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("invalid signUp.onCreateUser return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            signUp: {
                onCreateUser: () => null,
            },
        })
        const output = await api.signUp({
            headers,
            payload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "USER_CREATION_FAILED",
                message: "Failed to create user account with the provided metadata payload.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("invalid signUp.onCreateUser by missing required fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            signUp: {
                onCreateUser: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as User,
            },
        })
        const output = await api.signUp({
            headers,
            payload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "SCHEMA_PARSER_FAILED",
                message:
                    "An internal schema parsing error occurred. Please verify your schema configuration and validation adapter setup.",
            },
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("signUp without URL configuration", async () => {
        const output = await api.signUp({
            headers,
            payload: {},
        })
        expect(output).toEqual({
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
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("signUp with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers,
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
        expect(output.headers).toHaveValidSecurityHeaders({ location: "/dashboard" })
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp with redirect: true and absolute redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers,
            payload,
            redirect: true,
            redirectTo: "https://example.com/dashboard",
        })
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders({ location: "/dashboard" })
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers,
            payload,
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
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers,
            payload,
            redirect: true,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders({ location: "/" })
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            headers,
            payload,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp with doubleSubmitToken", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            headers,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
            doubleSubmitToken: csrfToken,
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp with doubleSubmitToken with invalid value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signUp({
            payload,
            headers,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
            doubleSubmitToken: "invalid-token",
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("signUp enables double-submit cookie manually", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const newHeaders = new Headers(headers)
        newHeaders.set("x-csrf-token", csrfToken)

        const output = await api.signUp({
            payload,
            headers: newHeaders,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
            skipCSRFCheck: false,
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signUp enables double-submit cookie manually and invalid value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const newHeaders = new Headers(headers)
        newHeaders.set("x-csrf-token", "invalid-value")

        const output = await api.signUp({
            payload,
            headers: newHeaders,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
            skipCSRFCheck: false,
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "CSRF_TOKEN_MISMATCH",
                message: "CSRF token verification failed. Please refresh and try again.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })
})
