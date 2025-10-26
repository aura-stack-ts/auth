import { describe, test, expect } from "vitest"
import { createRouter } from "@aura-stack/router"
import { signInAction } from "@/actions/index.js"
import { createOAuthIntegrations } from "@/oauth/index.js"

const oauthConfig = createOAuthIntegrations([
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

const { GET } = createRouter([signInAction({ oauth: oauthConfig })])

describe("signIn action", () => {
    test("unsupported oauth integration", async () => {
        const request = await GET(new Request("http://example.com/signIn/unsupported"))
        expect(request.status).toBe(400)
        expect(await request.json()).toEqual({ message: "OAuth provider not supported" })
    })

    test("supported oauth integration", async () => {
        const request = await GET(new Request("http://example.com/signIn/oauth-integration"))
        const headers = new Headers(request.headers)
        const cookie = headers.get("Set-Cookie")
        const location = headers.get("Location")

        expect(request.status).toBe(302)
        expect(cookie).toBeDefined()
        expect(location).toBeDefined()

        const searchParams = new URL(location as string).searchParams
        expect(location).toContain("https://example.com/oauth/authorize?")
        expect(searchParams.get("client_id")).toBe("oauth_client_id")
        expect(searchParams.get("state")).toBeDefined()
        expect(searchParams.get("redirect_uri")).toBe("http://example.com/auth/callback/oauth-integration")
    })

    describe("validate redirect URI", () => {
        const testCases = [
            {
                description: "standard case",
                url: "http://localhost:3000/signIn/oauth-integration",
                expected: "http://localhost:3000/auth/callback/oauth-integration",
            },
            {
                description: "with query parameters",
                url: "https://myapp.com/signIn/oauth-integration?ref=homepage",
                expected: "https://myapp.com/auth/callback/oauth-integration",
            },
            {
                description: "different domain",
                url: "https://anotherdomain.com/signIn/oauth-integration",
                expected: "https://anotherdomain.com/auth/callback/oauth-integration",
            },
        ]

        for (const { description, url, expected } of testCases) {
            test.concurrent(description, async ({ expect }) => {
                const request = await GET(new Request(url))
                const headers = new Headers(request.headers)
                const location = headers.get("Location") as string
                const searchParams = new URL(location).searchParams
                expect(request.status).toBe(302)
                expect(headers.get("Location")).toBeDefined()
                expect(searchParams.get("redirect_uri")).toMatch(expected)
            })
        }
    })
})
