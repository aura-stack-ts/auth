import { describe, test, expect } from "vitest"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { OAuthConfigSchema } from "@/schemas.js"
import { OAuthSecureConfig } from "@/@types/index.js"
import { oauthCustomService } from "./utilities.js"

describe("createOAuthIntegrations", () => {
    test("create oauth config for github", () => {
        const oauth = createOAuthIntegrations(["github"])
        const githubConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(githubConfig)
        expect(isValid.success).toBe(true)
    })

    test("create custom oauth config", () => {
        const oauth = createOAuthIntegrations([oauthCustomService])
        const customConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(customConfig)
        expect(isValid.success).toBe(true)
    })

    test("create oauth config with empty array", () => {
        const oauth = createOAuthIntegrations([])
        expect(Object.keys(oauth).length).toBe(0)
    })

    test("create oauth config for github and custom", () => {
        const oauth = createOAuthIntegrations(["github", oauthCustomService])
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

    test("create oauth config with invalid userinfo URL", () => {
        const oauth = createOAuthIntegrations([
            {
                ...oauthCustomService,
                userInfo: "not-a-valid-url",
            },
        ])
        const invalidConfig = Object.values(oauth)[0]
        const isValid = OAuthConfigSchema.safeParse(invalidConfig)
        expect(isValid.success).toBe(false)
    })
})
