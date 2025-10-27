import { describe, test, expect, vi } from "vitest"
import { callbackAction } from "@/actions/callback/callback.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { createRouter } from "@aura-stack/router"

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
    //const mockFetch = vi.fn()
    //vi.stubGlobal("fetch", mockFetch)

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
        expect(await response.json()).toEqual({ error: "OAuth provider not supported" })
    })
})
