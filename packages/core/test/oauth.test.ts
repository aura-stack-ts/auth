import { describe, test, expect } from "vitest"
import { createBuiltInOAuthProviders } from "@/oauth/index.js"
import { OAuthProviderConfigSchema } from "@/schemas.js"
import { OAuthProviderCredentials } from "@/@types/index.js"
import { oauthCustomService } from "./presets.js"

describe("createBuiltInOAuthProviders", () => {
    test("create oauth config for github", () => {
        const oauth = createBuiltInOAuthProviders(["github"])
        const githubConfig = Object.values(oauth)[0]
        const isValid = OAuthProviderConfigSchema.safeParse(githubConfig)
        expect(isValid.success).toBe(true)
    })

    test("create custom oauth config", () => {
        const oauth = createBuiltInOAuthProviders([oauthCustomService])
        const customConfig = Object.values(oauth)[0]
        const isValid = OAuthProviderConfigSchema.safeParse(customConfig)
        expect(isValid.success).toBe(true)
    })

    test("create oauth config with empty array", () => {
        const oauth = createBuiltInOAuthProviders([])
        expect(Object.keys(oauth).length).toBe(0)
    })

    test("create oauth config for github and custom", () => {
        const oauth = createBuiltInOAuthProviders(["github", oauthCustomService])
        for (const config of Object.values(oauth)) {
            const isValid = OAuthProviderConfigSchema.safeParse(config)
            expect(isValid.success).toBe(true)
        }
    })

    test("create oauth config with missing fields", () => {
        const oauth = createBuiltInOAuthProviders([
            {
                id: "oauth",
                name: "OAuth",
                authorizeURL: "https://example.com/authorize",
            } as OAuthProviderCredentials,
        ])
        const invalidConfig = Object.values(oauth)[0]
        const isValid = OAuthProviderConfigSchema.safeParse(invalidConfig)
        expect(isValid.success).toBe(false)
    })

    test("create oauth config with invalid userinfo URL", () => {
        const oauth = createBuiltInOAuthProviders([
            {
                ...oauthCustomService,
                userInfo: "not-a-valid-url",
            },
        ])
        const invalidConfig = Object.values(oauth)[0]
        const isValid = OAuthProviderConfigSchema.safeParse(invalidConfig)
        expect(isValid.success).toBe(false)
    })
})
