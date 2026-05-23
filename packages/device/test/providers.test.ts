import { describe, test, expect, vi, afterEach } from "vitest"
import { createBuiltInOAuthProviders } from "@/providers/index.ts"
import { DeviceProviderCredentials } from "@/@types/device.ts"

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("createBuiltInOAuthProviders", () => {
    test("create github provider configuration from environment variables", () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "test-client-id")
        const providers = createBuiltInOAuthProviders(["github"])
        expect(providers.github).toMatchObject({
            id: "github",
            name: "GitHub",
            deviceAuthorization: {
                url: "https://github.com/login/device/code",
                params: {
                    scope: "read:user user:email",
                },
            },
            accessToken: "https://github.com/login/oauth/access_token",
            userInfo: "https://api.github.com/user",
            clientId: "test-client-id",
        })
        expect(typeof providers.github.profile).toBe("function")
    })

    test("throws error for invalid provider configuration", () => {
        vi.stubEnv("GITHUB_CLIENT_ID", "")
        expect(() => createBuiltInOAuthProviders(["github"])).toThrow(
            /Missing or invalid environment variable for OAuth provider "github": GITHUB_CLIENT_ID/
        )
    })

    test("throws error for invalid provider configuration details", () => {
        vi.stubEnv("CUSTOM_CLIENT_ID", "test-client-id")
        expect(() =>
            createBuiltInOAuthProviders([
                {
                    id: "custom",
                    name: "Custom",
                    accessToken: "invalid-url",
                    deviceAuthorization: "invalid-url",
                } as DeviceProviderCredentials,
            ])
        ).toThrow(/Invalid configuration for OAuth provider "custom"/)
    })
})
