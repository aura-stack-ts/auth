import { describe, test, expect } from "vitest"
import { GET } from "@test/presets.js"
import { getCookie } from "@/cookie.js"

describe("signIn action", () => {
    test("unsupported oauth integration", async () => {
        const request = await GET(new Request("http://example.com/auth/signIn/unsupported"))
        expect(request.status).toBe(422)
        expect(await request.json()).toEqual({
            error: "invalid_request",
            error_description: "Invalid route parameters",
        })
    })

    describe("valid signIn requests", () => {
        const testCases = [
            {
                description: "standard case",
                url: "http://localhost:3000/auth/signIn/oauth-integration",
                expected: "http://localhost:3000/auth/callback/oauth-integration",
            },
            {
                description: "with query parameters",
                url: "https://myapp.com/auth/signIn/oauth-integration?ref=homepage",
                expected: "https://myapp.com/auth/callback/oauth-integration",
            },
            {
                description: "different domain",
                url: "https://anotherdomain.com/auth/signIn/oauth-integration",
                expected: "https://anotherdomain.com/auth/callback/oauth-integration",
            },
        ]

        for (const { description, url, expected } of testCases) {
            test.concurrent(description, async ({ expect }) => {
                const request = await GET(new Request(url))
                const headers = new Headers(request.headers)

                const stateCookie = getCookie(request, "state", { secure: url.startsWith("https://") })
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
