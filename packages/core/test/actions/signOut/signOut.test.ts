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
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
    })

    test("invalid sessionToken cookie", async () => {
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=invalid_token; __Host-aura-auth.csrfToken=${csrf}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
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
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
        decodeJWTMock.mockRestore()
    })

    test("valid sessionToken cookie with valid csrfToken in a secure connection", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}; __Host-aura-auth.csrfToken=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.sessionToken=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrfToken=;")
    })

    test("valid sessionToken cookie with valid csrfToken in a secure connection with referer", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}; __Host-aura-auth.csrfToken=${csrf}`,
                    "X-CSRF-Token": csrf,
                    Referer: "https://example.com/auth/form",
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.sessionToken=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrfToken=;")
        expect(request.headers.get("Location")).toContain("/auth/form")
    })

    test("valid sessionToken cookie with valid csrfToken in an insecure connection", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("http://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `aura-auth.sessionToken=${sessionToken}; aura-auth.csrfToken=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("aura-auth.sessionToken=;")
        expect(request.headers.get("Set-Cookie")).toContain("aura-auth.csrfToken=;")
    })

    test("valid sessionToken cookie with missing csrfToken", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({
            error: "invalid_session_token",
            error_description: "The provided sessionToken is invalid or has already expired",
        })
    })

    test("valid sessionToken cookie with redirectTo parameter", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token&redirectTo=/custom-logout-page", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}; __Host-aura-auth.csrfToken=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(202)
        expect(await request.json()).toEqual({ message: "Signed out successfully" })
        expect(request.headers.get("Set-Cookie")).toContain("__Secure-aura-auth.sessionToken=;")
        expect(request.headers.get("Set-Cookie")).toContain("__Host-aura-auth.csrfToken=;")
        expect(request.headers.get("Location")).toBe("/custom-logout-page")
    })

    test("valid sessionToken cookie with invalid redirectTo parameter", async () => {
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await POST(
            new Request("https://example.com/auth/signOut?token_type_hint=session_token&redirectTo=https://malicious.com", {
                method: "POST",
                headers: {
                    Cookie: `__Secure-aura-auth.sessionToken=${sessionToken}; __Host-aura-auth.csrfToken=${csrf}`,
                    "X-CSRF-Token": csrf,
                },
            })
        )
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({
            error: "invalid_redirect_to",
            error_description: "The redirectTo parameter does not match the hosted origin.",
        })
    })
})
