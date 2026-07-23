import { beforeEach, describe, expect, test, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

describe("signOut API", async () => {
    const csrfToken = await createCSRF(jose)

    test("invalid session", async () => {
        const out = await api.signOut({
            headers: new Headers(),
        })
        expect(out).toEqual({
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
    })

    test("signOut with valid session token", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const out = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })
        expect(out).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signOut with baseURL from createAuth config", async () => {
        const api = createAuth({ oauth: [], baseURL: "http://localhost:3000" }).api

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const out = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
        })
        expect(out).toMatchObject({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signOut with redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const out = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirectTo: "/dashboard",
        })
        expect(out.headers.get("Location")).toBe("/dashboard")
        expect(out).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("signOut with redirect: false and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const out = await api.signOut({
            headers: {
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            },
            redirect: false,
            redirectTo: "/dashboard",
        })
        expect(out).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
