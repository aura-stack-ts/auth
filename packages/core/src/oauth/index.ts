/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import type { LiteralUnion, OAuthProviderCredentials } from "@/@types/index.ts"
import { getEnv } from "@/env.ts"
import { github } from "./github.ts"
import { bitbucket } from "./bitbucket.ts"
import { figma } from "./figma.ts"
import { discord } from "./discord.ts"
import { gitlab } from "./gitlab.ts"
import { spotify } from "./spotify.ts"
import { x } from "./x.ts"
import { strava } from "./strava.ts"
import { mailchimp } from "./mailchimp.ts"
import { pinterest } from "./pinterest.ts"
import { twitch } from "./twitch.ts"
import { OAuthEnvSchema, OAuthProviderCredentialsSchema } from "@/schemas.ts"
import { AuthInternalError } from "@/errors.ts"
import { formatZodError } from "@/utils.ts"

export * from "./github.ts"
export * from "./bitbucket.ts"
export * from "./figma.ts"
export * from "./discord.ts"
export * from "./gitlab.ts"
export * from "./spotify.ts"
export * from "./x.ts"
export * from "./strava.ts"
export * from "./mailchimp.ts"
export * from "./pinterest.ts"
export * from "./twitch.ts"

export const builtInOAuthProviders = {
    github,
    bitbucket,
    figma,
    discord,
    gitlab,
    spotify,
    x,
    strava,
    mailchimp,
    pinterest,
    twitch,
} as const

/**
 * Loads OAuth provider credentials from environment variables based on the provider name.
 * Supported patterns for environment variables are:
 *   - `AURA_AUTH_{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *   - `AURA_{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *   - `AUTH_{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *   - `{OAUTH_PROVIDER}_CLIENT_{ID|SECRET}`
 *
 * @param oauth The name of the OAuth provider
 * @returns The credentials for the specified OAuth provider
 */
const defineOAuthEnvironment = (oauth: string) => {
    const loadEnvs = OAuthEnvSchema.safeParse({
        clientId: getEnv(`${oauth.toUpperCase()}_CLIENT_ID`),
        clientSecret: getEnv(`${oauth.toUpperCase()}_CLIENT_SECRET`),
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
        const oauthConfig = builtInOAuthProviders[config]()
        const parsed = OAuthProviderCredentialsSchema.safeParse({ ...oauthConfig, ...definition })
        if (!parsed.success) {
            const details = JSON.stringify(formatZodError(parsed.error), null, 2)
            throw new AuthInternalError(
                "INVALID_OAUTH_PROVIDER_CONFIGURATION",
                `Invalid configuration for OAuth provider "${config}": ${details}`
            )
        }
        return parsed.data
    }
    const hasCredentials = config.clientId && config.clientSecret
    const envConfig = hasCredentials ? {} : defineOAuthEnvironment(config.id)
    const parsed = OAuthProviderCredentialsSchema.safeParse({ ...envConfig, ...config })
    if (!parsed.success) {
        const details = JSON.stringify(formatZodError(parsed.error), null, 2)
        throw new AuthInternalError(
            "INVALID_OAUTH_PROVIDER_CONFIGURATION",
            `Invalid configuration for OAuth provider "${config.id}": ${details}`
        )
    }
    return parsed.data
}

/**
 * Constructs OAuth provider configurations from an array of provider names or configurations.
 * It loads the client ID and client secret from environment variables if only the provider name is provided.
 *
 * @param oauth - Array of OAuth provider configurations or provider names to be defined from environment variables
 * @returns A record of OAuth provider configurations
 * @example
 * // Using built-in provider with env variables
 * createBuiltInOAuthProviders(["github"])
 *
 * // Using built-in provider with explicit credentials via factory
 * createBuiltInOAuthProviders([github({ clientId: "...", clientSecret: "..." })])
 */
export const createBuiltInOAuthProviders = (oauth: (BuiltInOAuthProvider | OAuthProviderCredentials<any>)[] = []) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthProviderConfig(config)
        if (oauthConfig.id in previous) {
            throw new AuthInternalError(
                "DUPLICATED_OAUTH_PROVIDER_ID",
                `Duplicate OAuth provider id "${oauthConfig.id}" found. Each provider must have a unique id.`
            )
        }

        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<BuiltInOAuthProvider>, OAuthProviderCredentials<any>>
}

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders
