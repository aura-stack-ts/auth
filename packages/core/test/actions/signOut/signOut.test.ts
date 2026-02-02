import { describe, test, expect, vi } from "vitest"
import { createCSRF } from "@/secure.js"
import { POST, jose, sessionPayload } from "@test/presets.js"

describe("signOut action", async () => {
    const csrf = await createCSRF(jose)
    const { encodeJWT } = jose

    test("sessionToken cookie not present", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Host-aura-auth.csrfToken=${csrf}`,
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            type: "AUTH_SECURITY_ERROR",
            code: "SESSION_TOKEN_MISSING",
            message: "The sessionToken is missing.",
        })
    })

    test("invalid sessionToken cookie", async () => {
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=invalid_token; __Host-aura-auth.csrf_token=${csrf}`,
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            type: "AUTH_SECURITY_ERROR",
            code: "CSRF_TOKEN_MISSING",
            message: "The CSRF header is missing.",
        })
    })

    test("expired sessionToken cookie", async () => {
        const decodeJWTMock = vi.spyOn(await import("@/jose.js"), "createJoseInstance").mockImplementation(() => {
            throw new Error("Token expired")
        })

        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            type: "AUTH_SECURITY_ERROR",
            code: "CSRF_TOKEN_MISSING",
            message: "The CSRF token is missing.",
        })
        decodeJWTMock.mockRestore()
    })

    test("valid sessionToken cookie with valid csrfToken in a secure connection", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.session_token=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrf_token=;")
    })

    test("valid sessionToken cookie with valid csrfToken in a secure connection with referer", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrf}`,
                    "X-CSRF-Token": csrf,
                    Referer: "https://example.com/auth/form",
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.session_token=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrf_token=;")
        expect(request.headers.get("Location")).toContain("/auth/form")
    })

    test("valid sessionToken cookie with valid csrfToken in an insecure connection", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("http://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("aura-auth.session_token=;")
        expect(request.headers.get("Set-Cookie")).toContain("aura-auth.csrf_token=;")
    })

    test("valid sessionToken cookie with missing csrfToken", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            type: "AUTH_SECURITY_ERROR",
            code: "CSRF_TOKEN_MISSING",
            message: "The CSRF token is missing.",
        })
    })

    test("valid sessionToken cookie with redirectTo parameter", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token&redirectTo=/custom-logout-page", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.session_token=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrf_token=;")
        expect(request.headers.get("Location")).toBe("/custom-logout-page")
    })

    test("valid sessionToken cookie with invalid redirectTo parameter", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token&redirectTo=https://malicious.com", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=${sessionToken}; __Host-aura-auth.csrf_token=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({
            message: "Signed out successfully",
        })
    })
})
