import { describe, expect, test } from "vitest"
import { createAuthorizationURL, createRedirectURI } from "@/actions/signIn/authorization.js"

describe("createRedirectURI", () => {
    const testCases = [
        {
            description: "creates redirect URI from standard URL",
            requestURL: "https://example.com/signIn/github",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with port",
            requestURL: "http://localhost:3000/signIn/google",
            oauth: "google",
            expected: "http://localhost:3000/auth/callback/google",
        },
        {
            description: "creates redirect URI from URL with path and query",
            requestURL: "https://example.com/signIn/github?query=123",
            oauth: "facebook",
            expected: "https://example.com/auth/callback/facebook",
        },
        {
            description: "creates redirect URI from URL with trailing slash",
            requestURL: "https://example.com/signIn/github/",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with undefined query",
            requestURL: "https://example.com/signIn/github?",
            oauth: "github",
            expected: "https://example.com/auth/callback/github",
        },
        {
            description: "creates redirect URI from URL with hash",
            requestURL: "https://example.com/signIn/twitter#section",
            oauth: "twitter",
            expected: "https://example.com/auth/callback/twitter",
        },
        {
            description: "creates redirect URI from URL with subdomain",
            requestURL: "https://subdomain.example.com/signIn/linkedin",
            oauth: "linkedin",
            expected: "https://subdomain.example.com/auth/callback/linkedin",
        },
        {
            description: "creates redirect URI from URL with IP address",
            requestURL: "http://192.168.1.1/signIn/github",
            oauth: "github",
            expected: "http://192.168.1.1/auth/callback/github",
        },
    ]

    for (const { description, requestURL, oauth, expected } of testCases) {
        test(description, () => {
            const redirectURI = createRedirectURI(requestURL, oauth)
            expect(redirectURI).toBe(expected)
        })
    }
})

describe("createAuthorizationURL", () => {
    describe("valid OAuth configuration", () => {
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
                "123",
                "challenge",
                "S256"
            )

            const searchParams = new URL(url).searchParams
            expect(searchParams.get("client_id")).toBe("1")
            expect(searchParams.has("client_secret")).toBeFalsy()
            expect(searchParams.get("redirect_uri")).toBe("https://example.com/auth/callback")
            expect(searchParams.get("state")).toBe("123")
            expect(searchParams.get("scope")).toBe("read:user")
            expect(searchParams.get("response_type")).toBe("code")
        })
    })

    describe("invalid OAuth configuration", () => {
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
                expect(() => createAuthorizationURL(oauthConfig as any, redirectURL, "123", "challenge", "S256")).toThrow(
                    expected
                )
            })
        }
    })
})
