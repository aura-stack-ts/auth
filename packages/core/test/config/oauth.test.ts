import { describe, test, expect, vi } from "vitest"
import { createBuiltInOAuthProviders, defineOpenIDProviderConfig } from "@/config/get-oauth.ts"
import { builtInOAuthProviders, type GitHubProfile } from "@/oauth/index.ts"
import { openIDCustomProvider } from "@test/setup/presets.ts"
import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

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
        ).toThrow(
            "The loaded configuration settings array failed standard library schema validation checks against required engine operational footprints."
        )
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
        expect(() => createBuiltInOAuthProviders(["github", "github"])).toThrow(
            "The registration collection contains duplicate identifier keys. Unique registration indices are mandatory across tracking providers"
        )
    })

    test("create oidc config", () => {
        const oidc = createBuiltInOAuthProviders([openIDCustomProvider])
        expect(oidc["oidc-provider"]).toMatchObject({
            id: "oidc-provider",
            name: "OIDC",
            clientId: "oidc_client_id",
            clientSecret: "oidc_client_secret",
            oidc: {
                issuer: "https://id.example.com",
            },
        })
    })

    test("create oidc config with slugs in issuer", () => {
        const oidc = createBuiltInOAuthProviders([
            { ...openIDCustomProvider, issuer: "https://app.com/issuer/:teamId/apps/:appId", teamId: 1, appId: 2 } as any,
        ])
        expect(oidc["oidc-provider"]).toMatchObject({
            id: "oidc-provider",
            name: "OIDC",
            clientId: "oidc_client_id",
            clientSecret: "oidc_client_secret",
            oidc: {
                issuer: "https://app.com/issuer/1/apps/2",
            },
        })
    })

    test("infer dynamic slugs in issuer via environment variables", () => {
        vi.stubEnv("AURA_AUTH_OIDC_PROVIDER_TEAMID", "1")
        vi.stubEnv("AURA_AUTH_OIDC_PROVIDER_APPID", "2")

        const oidc = createBuiltInOAuthProviders([
            { ...openIDCustomProvider, issuer: "https://app.com/issuer/:teamId/apps/:appId" } as any,
        ])
        expect(oidc["oidc-provider"]).toMatchObject({
            id: "oidc-provider",
            name: "OIDC",
            clientId: "oidc_client_id",
            clientSecret: "oidc_client_secret",
            oidc: {
                issuer: "https://app.com/issuer/1/apps/2",
            },
        })
    })
})

describe("defineOpenIDProviderConfig", () => {
    test("default oidc provider", () => {
        const oidc = defineOpenIDProviderConfig({
            id: "oidc",
            name: "OIDC",
            issuer: "https://app.com/issuer",
            clientId: "oidc_id",
            clientSecret: "oidc_secret",
        })
        expect(oidc).toMatchObject({
            id: "oidc",
            name: "OIDC",
            clientId: "oidc_id",
            clientSecret: "oidc_secret",
            oidc: {
                issuer: "https://app.com/issuer",
            },
        })
    })

    test("oidc provider with dynamic params", () => {
        const oidc = defineOpenIDProviderConfig({
            id: "oidc",
            name: "OIDC",
            issuer: "https://app.com/issuer/:teamId/apps/:appId",
            clientId: "oidc_id",
            clientSecret: "oidc_secret",
            teamId: 1,
            appId: 2,
        } as any)
        expect(oidc).toMatchObject({
            id: "oidc",
            name: "OIDC",
            clientId: "oidc_id",
            clientSecret: "oidc_secret",
            oidc: {
                issuer: "https://app.com/issuer/1/apps/2",
            },
        })
    })
})
