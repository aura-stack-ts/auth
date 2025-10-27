import { describe, test, expect } from "vitest"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { OAuthConfigSchema } from "@/schemas.js"
import { OAuthSecureConfig } from "@/@types/index.js"

describe("createOAuthIntegrations", () => {
    test("create oauth config for github", () => {
        const oauth = createOAuthIntegrations(["github"])
        const githubConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(githubConfig)
        expect(isValid.success).toBe(true)
    })

    test("create custom oauth config", () => {
        const oauth = createOAuthIntegrations([
            {
                id: "oauth",
                name: "OAuth",
                authorizeURL: "https://example.com/authorize",
                accessToken: "https://example.com/token",
                clientId: "oauth-client-id",
                clientSecret: "oauth-client-secret",
                responseType: "code",
                scope: "read",
                userInfo: "https://example.com/userinfo",
            },
        ])
        const customConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(customConfig)
        expect(isValid.success).toBe(true)
    })

    test("create oauth config with empty array", () => {
        const oauth = createOAuthIntegrations([])
        expect(Object.keys(oauth).length).toBe(0)
    })

    test("create oauth config for github and custom", () => {
        const oauth = createOAuthIntegrations([
            "github",
            {
                id: "oauth",
                name: "OAuth",
                authorizeURL: "https://example.com/authorize",
                accessToken: "https://example.com/token",
                clientId: "oauth-client-id",
                clientSecret: "oauth-client-secret",
                responseType: "code",
                scope: "read",
                userInfo: "https://example.com/userinfo",
            },
        ])
        for (const config of Object.values(oauth)) {
            const isValid = OAuthConfigSchema.safeParse(config)
            expect(isValid.success).toBe(true)
        }
    })

    test("create oauth config with missing fields", () => {
        const oauth = createOAuthIntegrations([
            {
                id: "oauth",
                name: "OAuth",
                authorizeURL: "https://example.com/authorize",
            } as OAuthSecureConfig,
        ])
        const invalidConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(invalidConfig)
        expect(isValid.success).toBe(false)
    })
})
