import { describe, test, expect, vi } from "vitest"
import { createPKCE } from "@/secure.js"
import { getCookie, setCookie } from "@/cookie.js"
import { GET, secureCookieOptions } from "@test/presets.js"

describe("callbackAction", () => {
    test("invalid endpoint", async () => {
        const response = await GET(new Request("https://example.com/callback/invalid"))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "No route found for path: /callback/invalid",
        })
    })

    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Invalid route parameters" })
    })

    test("unsupported oauth integration", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/unknown?code=123&state=abc"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "Invalid route parameters",
        })
    })

    test("without cookies", async () => {
        const response = await GET(new Request("https://example.com/auth/callback/oauth-integration?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "No cookies found. There is no active session",
        })
    })

    test("mismatching state", async () => {
        const state = setCookie("state", "123", secureCookieOptions)
        const redirectURI = setCookie("redirect_uri", "https://example.com/auth/callback/oauth-integration", secureCookieOptions)
        const redirectTo = setCookie("redirect_to", "/auth", secureCookieOptions)
        const codeVerifier = setCookie("code_verifier", "verifier_123", secureCookieOptions)

        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifier].join("; "),
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Mismatching state" })
    })

    test("callback action workflow", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        const accessTokenMock = {
            access_token: "access_123",
            token_type: "Bearer",
        }

        const userInfoMock = {
            id: "user_123",
            email: "john.doe@example.com",
            name: "John Doe",
            picture: "https://example.com/john-doe.jpg",
        }

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => userInfoMock,
        })

        const state = setCookie("state", "abc", secureCookieOptions)
        const redirectURI = setCookie("redirect_uri", "https://example.com/auth/callback/oauth-integration", secureCookieOptions)
        const redirectTo = setCookie("redirect_to", "/auth", secureCookieOptions)
        const { codeVerifier } = await createPKCE()
        const codeVerifierCookie = setCookie("code_verifier", codeVerifier, secureCookieOptions)

        const response = await GET(
            new Request("https://example.com/auth/callback/oauth-integration?code=auth_code_123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifierCookie].join("; "),
                },
            })
        )

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "auth_code_123",
                redirect_uri: "https://example.com/auth/callback/oauth-integration",
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }).toString(),
        })

        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/userinfo", {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: "Bearer access_123",
            },
        })
        expect(fetch).toHaveBeenCalledTimes(2)
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/auth")

        expect(getCookie(response, "sessionToken", { secure: true })).toBeDefined()
        expect(getCookie(response, "state", { secure: true })).toEqual("")
        expect(getCookie(response, "redirect_to", { secure: true })).toEqual("")
        expect(getCookie(response, "redirect_uri", { secure: true })).toEqual("")
    })
})
