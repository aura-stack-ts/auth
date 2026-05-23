import { DeviceProviderCredentials } from "@/@types/device.ts"
import { LiteralUnion } from "@/@types/index.ts"
import { github } from "@/providers/github.ts"
import { DeviceProviderCredentialsSchema } from "@/schemas.ts"
import { getEnv } from "@/shared/env.ts"
import { pick, safeParse } from "valibot"

export * from "@/providers/github.ts"

export const builtInDeviceProviders = {
    github,
} as const

export type BuiltInDeviceProvider = keyof typeof builtInDeviceProviders

const defineOAuthEnvironment = (providerId: string) => {
    const clientId = getEnv(`${providerId.replace(/-/g, "_").toUpperCase()}_CLIENT_ID`)
    const { success, output } = safeParse(pick(DeviceProviderCredentialsSchema, ["clientId"]), { clientId })
    if (!success) {
        throw new Error(
            `Missing or invalid environment variable for OAuth provider "${providerId}": ${providerId.replace(/-/g, "_").toUpperCase()}_CLIENT_ID`
        )
    }
    return output.clientId
}

const defineOAuthProviderConfig = (config: BuiltInDeviceProvider | DeviceProviderCredentials): DeviceProviderCredentials => {
    if (typeof config === "string") {
        const clientId = defineOAuthEnvironment(config)
        const oauthConfig = builtInDeviceProviders[config]()
        const { success, output } = safeParse(DeviceProviderCredentialsSchema, { ...oauthConfig, clientId })
        if (!success) {
            throw new Error(`Invalid configuration for OAuth provider "${config}"`)
        }
        return { ...oauthConfig, ...output } as DeviceProviderCredentials
    }
    const hasCredentials = config.clientId
    const envConfig = hasCredentials ? {} : { clientId: defineOAuthEnvironment(config.id) }
    const { success, output, issues } = safeParse(DeviceProviderCredentialsSchema, { ...envConfig, ...config })
    if (!success) {
        const details = JSON.stringify({ [config.id]: issues }, null, 2)
        throw new Error(
            `INVALID_OAUTH_PROVIDER_CONFIGURATION: Invalid configuration for OAuth provider "${config.id}": ${details}`
        )
    }
    return { ...config, ...output } as DeviceProviderCredentials
}

/**
 * Constructs Device provider configurations from an array of provider names or configurations.
 * It loads the client ID from environment variables if only the provider name is provided.
 *
 * @param oauth - Array of Device provider configurations or provider names to be defined from environment variables
 * @returns A record of Device provider configurations
 * @example
 * // Using built-in provider with env variables
 * createBuiltInOAuthProviders(["github"])
 *
 * // Using built-in provider with explicit credentials via factory
 * createBuiltInOAuthProviders([github({ clientId: "...", deviceAuthorization: { ...} })])
 */
export const createBuiltInOAuthProviders = (oauth: (BuiltInDeviceProvider | DeviceProviderCredentials<any>)[] = []) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthProviderConfig(config)
        if (oauthConfig.id in previous) {
            throw new Error("Duplicate OAuth provider configuration detected for provider ID: " + oauthConfig.id)
        }
        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<BuiltInDeviceProvider>, DeviceProviderCredentials<any>>
}
