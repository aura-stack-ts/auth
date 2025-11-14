import { describe, test, expect, vi } from "vitest"
import { callbackAction } from "@/actions/callback/callback.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { createRouter } from "@aura-stack/router"
import { getCookiesByNames, setCookiesByNames } from "@/cookie.js"

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

const { GET } = createRouter([callbackAction({ oauth: oauthIntegrations })])

describe("callbackAction", () => {
    test("endpoint without code and state", async () => {
        const response = await GET(new Request("https://example.com/callback/unknown"))
        expect(response.status).toBe(422)
        /**
         * The request is missing the required "code" and "state" parameters. The body of the response is provided
         * by the Aura Stack Router's built-in validation mechanism not by our action.
         */
        expect(await response.json()).toEqual({ message: "Invalid search parameters" })
    })

    test("unsupported oauth integration", async () => {
        const response = await GET(new Request("https://example.com/callback/unknown?code=123&state=abc"))
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            error: "invalid_request",
            error_description: "Unsupported OAuth Social Integration",
        })
    })

    test("mismatching state", async () => {
        const response = await GET(
            new Request("https://example.com/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: "aura-stack.state=123; Path=/; SameSite=Lax",
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

    test("without missing redirect_uri cookie", async () => {
        const response = await GET(
            new Request("https://example.com/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: "aura-stack.state=abc; Path=/; SameSite=Lax",
                },
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({ error: "invalid_request", error_description: "Invalid OAuth configuration" })
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

        const cookies = setCookiesByNames({
            state: "abc",
            redirect_uri: "https://example.com/callback/oauth-integration",
            redirect_to: "https://example.com/auth",
        })
        const response = await GET(
            new Request("https://example.com/callback/oauth-integration?code=123&state=abc", {
                headers: {
                    Cookie: cookies,
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
        expect(response.headers.get("Location")).toBe("https://example.com/auth")

        const { state, redirect_to, redirect_uri, sessionToken } = getCookiesByNames(response.headers.get("Set-Cookie") ?? "", [
            "state",
            "redirect_uri",
            "redirect_to",
            "sessionToken",
        ])
        console.log(response.headers.get("Set-Cookie"))
        expect(state).toEqual("")
        expect(redirect_uri).toEqual("")
        expect(redirect_to).toEqual("")

        /**
         * The JWT can't be precisely tested here because it contains dynamic values such as
         * the issued at time (iat), jwt id (jti), and expiration time (exp). Instead, we
         * verify that a sessionToken cookie is indeed set.
         */
        expect(sessionToken).toBeDefined()
    })
})
