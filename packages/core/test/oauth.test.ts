import { describe, test, expect } from "vitest"
import { createBuiltInOAuthProviders, builtInOAuthProviders, GitHubProfile } from "@/oauth/index.js"
import { OAuthProviderCredentials, User } from "@/@types/index.js"

describe("createBuiltInOAuthProviders", () => {
    test("create oauth config for github", () => {
        const oauth = createBuiltInOAuthProviders(["github"])
        expect(oauth.github.clientId).toBe("github-client-id")
        expect(oauth.github.clientSecret).toBe("github-client-secret")
    })

    test("create oauth config for github object syntax", () => {
        const oauth = createBuiltInOAuthProviders([builtInOAuthProviders.github()])
        expect(oauth.github.clientId).toBe("github-client-id")
        expect(oauth.github.clientSecret).toBe("github-client-secret")
    })

    test("create oauth config with missing fields", () => {
        expect(() =>
            createBuiltInOAuthProviders([
                {
                    id: "oauth_provider",
                    name: "OAuth",
                    authorizeURL: "https://example.com/authorize",
                } as OAuthProviderCredentials,
            ])
        ).toThrow('Invalid configuration for OAuth provider "oauth_provider"')
    })

    test("create oauth config override", async () => {
        const { github } = builtInOAuthProviders
        const oauth = createBuiltInOAuthProviders([github({ clientId: "id", scope: "scope:override" })])
        const githubConfig = oauth.github
        expect(githubConfig.id).toBe("github")
        expect(githubConfig.scope).toBe("scope:override")
        expect(githubConfig.clientId).toBe("id")
        expect(githubConfig.clientSecret).toBe("github-client-secret")
    })

    test("create oauth config with custom profile function", () => {
        const profile = (): User => {
            return { sub: "override" } as User
        }
        const { github } = builtInOAuthProviders
        const oauth = createBuiltInOAuthProviders([github({ profile })])
        expect(oauth.github.clientId).toBe("github-client-id")
        expect(oauth.github.profile?.({ id: 123 } as GitHubProfile)).toEqual({ sub: "override" })
        expect(oauth.github.profile?.({ id: 123 } as GitHubProfile)).not.toEqual({ sub: "123" })
    })

    test("create oauth config with duplicated id", () => {
        expect(() => createBuiltInOAuthProviders(["github", "github"])).toThrow('Duplicate OAuth provider id "github"')
    })
})
