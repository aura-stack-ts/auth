import { describe, expect, test } from "vitest"
import { createAuthorizationURL } from "@/actions/signIn/authorize.js"

describe("createAuthorizationURL", () => {
    describe("Valid OAuth configuration", () => {
        test("valid OAuth configuration with all fields", () => {
            const url = createAuthorizationURL(
                {
                    id: "oauth-integration",
                    name: "OAuth Integration",
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientId: "1",
                    clientSecret: "2",
                },
                "https://example.com/auth/callback",
                "state"
            )

            const searchParams = new URL(url).searchParams
            expect(searchParams.get("client_id")).toBe("1")
            expect(searchParams.has("client_secret")).toBeFalsy()
            expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback")
            expect(searchParams.get("state")).toBe("state")
            expect(searchParams.get("scope")).toBe("read:user")
            expect(searchParams.get("response_type")).toBe("code")
        })
    })

    describe("Invalid OAuth configuration", () => {
        const testCases = [
            {
                description: "missing clientId",
                oauthConfig: {
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientSecret: "2",
                },
                redirectURL: "https://example.com/auth/callback",
                expected: /Invalid OAuth configuration/,
            },
            {
                description: "missing clientSecret",
                oauthConfig: {
                    authorizeURL: "https://example.com/oauth/authorize",
                    accessToken: "https://example.com/oauth/access_token",
                    userInfo: "https://example.com/oauth/user_info",
                    scope: "read:user",
                    responseType: "code",
                    clientId: "1",
                },
                redirectURL: "https://example.com/auth/callback",
                expected: /Invalid OAuth configuration/,
            },
        ]

        for (const { description, oauthConfig, redirectURL, expected } of testCases) {
            test(description, () => {
                expect(() => createAuthorizationURL(oauthConfig as any, redirectURL, "state")).toThrowError(expected)
            })
        }
    })
})
