import { describe, test, expect, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/setup/auth.ts"
import { createCSRF } from "@/exports/crypto.ts"

describe("signInCredentials API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signIn flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers: {
                ...headers,
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
            },
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("invalid authorize return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            credentials: {
                authorize: () => null,
            },
        })
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "wrongpassword",
            },
        })
        expect(output).toEqual({
            success: false,
            error: {
                code: "AUTH_CREDENTIALS_INVALID",
                message: "The user's session couldn't be established with the provided credentials.",
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("invalid authorize by missing required fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            credentials: {
                authorize: () =>
                    ({
                        name: "John Doe",
                        email: "johndoe@example.com",
                    }) as any,
            },
        })
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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

    test("simulate hashing and verification", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
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
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signIn without URL configuration", async () => {
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("signIn with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signIn with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://example.com/dashboard",
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
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signIn redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: true,
            redirectTo: "https://malicious.com/phishing",
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
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signIn with redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://malicious.com/phishing",
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
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signInCredentials with doubleSubmitToken", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            doubleSubmitToken: csrfToken,
        })
        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signInCredentials with doubleSubmitToken and invalid value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            doubleSubmitToken: "invalid-value",
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

    test("signInCredentials enables double-submit cookie manually", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const newHeaders = new Headers(headers)
        newHeaders.set("x-csrf-token", csrfToken)

        const output = await api.signInCredentials({
            headers: newHeaders,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            skipCSRFCheck: false,
        })
        expect(output).toEqual({
            success: true,
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Host-aura-auth.csrf_token",
                value: expect.any(String),
                sameSite: "strict",
                path: "/",
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                sameSite: "lax",
                path: "/",
            }),
        ])
    })

    test("signInCredentials enables double-submit cookie manually and invalid value", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const newHeaders = new Headers(headers)
        newHeaders.set("x-csrf-token", "invalid-value")

        const output = await api.signInCredentials({
            headers: newHeaders,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            skipCSRFCheck: false,
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
})
