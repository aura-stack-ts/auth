/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import type { LiteralUnion, OAuthProviderCredentials } from "@/@types/index.js"
import { github } from "./github.js"
import { bitbucket } from "./bitbucket.js"
import { figma } from "./figma.js"
import { discord } from "./discord.js"
import { gitlab } from "./gitlab.js"
import { spotify } from "./spotify.js"
import { x } from "./x.js"
import { strava } from "./strava.js"
import { OAuthEnvSchema } from "@/schemas.js"
import { AuthInternalError } from "@/errors.js"
import { formatZodError } from "@/utils.js"

export * from "./github.js"
export * from "./bitbucket.js"
export * from "./figma.js"
export * from "./discord.js"
export * from "./gitlab.js"
export * from "./spotify.js"
export * from "./x.js"
export * from "./strava.js"

export const builtInOAuthProviders = {
    github,
    bitbucket,
    figma,
    discord,
    gitlab,
    spotify,
    x,
    strava,
} as const

/**
 * Loads OAuth provider credentials from environment variables based on the provider name.
 * Supported patterns for environment variables are:
 *   - `AURA_AUTH_{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *   - `AUTH_{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *   - `{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *
 * @param oauth The name of the OAuth provider
 * @returns The credentials for the specified OAuth provider
 */
const defineOAuthEnvironment = (oauth: string) => {
    const env = process.env
    const clientIdSuffix = `${oauth.toUpperCase()}_CLIENT_ID`
    const clientSecretSuffix = `${oauth.toUpperCase()}_CLIENT_SECRET`
    const loadEnvs = OAuthEnvSchema.safeParse({
        clientId: env[`AURA_AUTH_${clientIdSuffix}`] ?? env[`AUTH_${clientIdSuffix}`] ?? env[`${clientIdSuffix}`],
        clientSecret: env[`AURA_AUTH_${clientSecretSuffix}`] ?? env[`AUTH_${clientSecretSuffix}`] ?? env[`${clientSecretSuffix}`],
    })
    if (!loadEnvs.success) {
        const msg = JSON.stringify(formatZodError(loadEnvs.error), null, 2)
        throw new AuthInternalError("INVALID_ENVIRONMENT_CONFIGURATION", msg)
    }
    return loadEnvs.data
}

const defineOAuthProviderConfig = (config: BuiltInOAuthProvider | OAuthProviderCredentials) => {
    if (typeof config === "string") {
        const definition = defineOAuthEnvironment(config)
        const oauthConfig = builtInOAuthProviders[config]
        return {
            ...oauthConfig,
            ...definition,
        }
    }
    return config
}

/**
 * Constructs OAuth provider configurations from an array of provider names or configurations.
 * It loads the client ID and client secret from environment variables if only the provider name is provided.
 *
 * @param oauth - Array of OAuth provider configurations or provider names to be defined from environment variables
 * @returns A record of OAuth provider configurations
 */
export const createBuiltInOAuthProviders = (oauth: (BuiltInOAuthProvider | OAuthProviderCredentials)[] = []) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthProviderConfig(config)
        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<BuiltInOAuthProvider>, OAuthProviderCredentials>
}

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders
