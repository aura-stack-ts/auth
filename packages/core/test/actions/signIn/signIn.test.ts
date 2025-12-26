import { describe, test, expect } from "vitest"
import { GET } from "@test/presets.js"
import { getSetCookie } from "@/cookie.js"

describe("signIn action", () => {
    test("unsupported oauth provider", async () => {
        const request = await GET(new Request("http://example.com/auth/signIn/unsupported"))
        expect(request.status).toBe(422)
        expect(await request.json()).toEqual({
            error: "invalid_request",
            errors: {
                oauth: {
                    code: "invalid_value",
                    message: "The OAuth provider is not supported or invalid.",
                },
            },
        })
    })

    describe("valid signIn requests", () => {
        const testCases = [
            {
                description: "standard case",
                url: "http://localhost:3000/auth/signIn/oauth-provider",
                expected: "http://localhost:3000/auth/callback/oauth-provider",
            },
            {
                description: "with query parameters",
                url: "https://myapp.com/auth/signIn/oauth-provider?ref=homepage",
                expected: "https://myapp.com/auth/callback/oauth-provider",
            },
            {
                description: "different domain",
                url: "https://anotherdomain.com/auth/signIn/oauth-provider",
                expected: "https://anotherdomain.com/auth/callback/oauth-provider",
            },
        ]

        for (const { description, url, expected } of testCases) {
            test.concurrent(description, async ({ expect }) => {
                const request = await GET(new Request(url))
                const headers = new Headers(request.headers)

                const stateCookie = getSetCookie(request, "__Secure-aura-auth.state")
                const location = headers.get("Location") as string
                const searchParams = new URL(location).searchParams

                expect(request.status).toBe(302)
                expect(location).toContain("https://example.com/oauth/authorize?")
                expect(searchParams.get("client_id")).toBe("oauth_client_id")
                expect(searchParams.get("redirect_uri")).toMatch(expected)
                expect(stateCookie).toBeDefined()
            })
        }
    })
})
