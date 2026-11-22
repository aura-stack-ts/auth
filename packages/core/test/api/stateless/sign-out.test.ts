import { describe, expect, test, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/setup/auth.ts"
import { createCSRF } from "@/exports/crypto.ts"
import { sessionPayload } from "@test/setup/presets.ts"

describe("signOut API", async () => {
    const csrfToken = await createCSRF(jose)

    test("invalid session", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

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
    })

    test("signOut with valid session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
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
                name: "__Host-aura-auth.csrf_token",
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut with baseURL from createAuth config", async () => {
        const api = createAuth({ baseURL: "http://localhost:3000" }).api

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
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
                name: "__Host-aura-auth.csrf_token",
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut with redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
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
        expect(output.headers).toHaveValidSecurityHeaders({ location: "/dashboard" })
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Host-aura-auth.csrf_token",
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut with redirect: false and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
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
                name: "__Host-aura-auth.csrf_token",
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut per-call fallbackRedirectTo overrides the global fallback", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")
        const configuredApi = createAuth({
            baseURL: "https://example.com",
            fallbackRedirectTo: "/global-safe",
        }).api
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const out = await configuredApi.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            redirectTo: "https://untrusted.example/redirect",
            fallbackRedirectTo: "/specific-safe",
        })

        expect(out).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: "/specific-safe",
        })
        expect(out.headers).toHaveValidSecurityHeaders()
        expect(out.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Host-aura-auth.csrf_token",
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut with doubleSubmitToken", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            doubleSubmitToken: csrfToken,
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
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut with invalid doubleSubmitToken", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.signOut({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
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

    test("signOut enables double-submit cookie manually", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.signOut({
            headers: {
                "X-CSRF-Token": csrfToken,
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            skipCSRFCheck: false,
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
                value: "",
                sameSite: "strict",
                expires: new Date(0),
            }),
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                sameSite: "lax",
                expires: new Date(0),
            }),
        ])
    })

    test("signOut enables double-submit cookie manually and invalid token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT(sessionPayload)

        const output = await api.signOut({
            headers: {
                "X-CSRF-Token": "invalid-token",
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
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
