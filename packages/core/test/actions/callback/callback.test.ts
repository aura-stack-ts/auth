import { describe, test, expect, vi } from "vitest"
import { callbackAction } from "@/actions/callback/callback.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { createRouter } from "@aura-stack/router"
import { defaultCookieConfig, getCookie, setCookie } from "@/cookie.js"
import { generateSecure } from "@/secure.js"
import { onErrorHandler } from "@/utils.js"

const oauthIntegrations = createOAuthIntegrations([
    {
        id: "oauth-integration",
        name: "OAuth",
        authorizeURL: "https://example.com/oauth/authorize",
        accessToken: "https://example.com/oauth/token",
        scope: "profile email",
        responseType: "code",
        userInfo: "https://example.com/oauth/userinfo",
        clientId: "oauth_client_id",
        clientSecret: "oauth_client_secret",
    },
])

const { GET } = createRouter([callbackAction({ oauth: oauthIntegrations, cookies: defaultCookieConfig })], {
    onError: onErrorHandler
})

describe("callbackAction", () => {
    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/callback/unknown"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Invalid route parameters" })
    })

    test("unsupported oauth integration", async () => {
        const response = await GET(new Request("https://example.com/callback/unknown?code=123&state=abc"))
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "Invalid route parameters",
        })
    })

    test("mismatching state", async () => {
        const state = setCookie("state", "123", { secure: true, prefix: "__Secure-" })
        const redirectURI = setCookie("redirect_uri", "https://example.com/callback/oauth-integration", {
            secure: true,
            prefix: "__Secure-",
        })
        const redirectTo = setCookie("redirect_to", "/auth", { secure: true, prefix: "__Secure-" })
        const codeVerifier = setCookie("code_verifier", "verifier_123", { secure: true, prefix: "__Secure-" })

        const response = await GET(
            new Request("https://example.com/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifier].join("; "),
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Mismatching state" })
    })

    test("without cookies", async () => {
        const response = await GET(new Request("https://example.com/callback/oauth-integration?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "No cookies found. There is no active session",
        })
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
            json: async () => accessTokenMock,
        })

        mockFetch.mockResolvedValueOnce({
            json: async () => userInfoMock,
        })

        const state = setCookie("state", "abc", { secure: true, prefix: "__Secure-" })
        const redirectURI = setCookie("redirect_uri", "https://example.com/callback/oauth-integration", {
            secure: true,
            prefix: "__Secure-",
        })
        const redirectTo = setCookie("redirect_to", "/auth", { secure: true, prefix: "__Secure-" })
        const codeVerifierValue = generateSecure(64)
        const codeVerifier = setCookie("code_verifier", codeVerifierValue, { secure: true, prefix: "__Secure-" })

        const response = await GET(
            new Request("https://example.com/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: [state, redirectURI, redirectTo, codeVerifier].join("; "),
                },
            })
        )
        expect(fetch).toHaveBeenCalledWith("https://example.com/oauth/token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "oauth_client_id",
                client_secret: "oauth_client_secret",
                code: "123",
                redirect_uri: "https://example.com/callback/oauth-integration",
                grant_type: "authorization_code",
                code_verifier: codeVerifierValue,
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
