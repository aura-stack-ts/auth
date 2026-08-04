/**
 * @module OAuth Providers
 *
 * This modules re-exports OAuth providers available in Aura Auth to be used in the Auth instance configuration.
 */
import { type LiteralUnion, type RuntimeOAuthProvider } from "@/@types/index.ts"
import type { OpenIDProvider } from "@/@types/oidc.ts"
import { getEnv } from "@/shared/env.ts"
import { github } from "@/oauth/github.ts"
import { bitbucket } from "@/oauth/bitbucket.ts"
import { figma } from "@/oauth/figma.ts"
import { discord } from "@/oauth/discord.ts"
import { gitlab } from "@/oauth/gitlab.ts"
import { spotify } from "@/oauth/spotify.ts"
import { x } from "@/oauth/x.ts"
import { strava } from "@/oauth/strava.ts"
import { mailchimp } from "@/oauth/mailchimp.ts"
import { pinterest } from "@/oauth/pinterest.ts"
import { twitch } from "@/oauth/twitch.ts"
import { notion } from "@/oauth/notion.ts"
import { dropbox } from "@/oauth/dropbox.ts"
import { atlassian } from "@/oauth/atlassian.ts"
import { clickUp } from "@/oauth/click-up.ts"
import { dribbble } from "@/oauth/dribbble.ts"
import { hubspot } from "@/oauth/hubspot.ts"
import { google } from "@/oauth/google.ts"
import { huggingface } from "@/oauth/huggingface.ts"
import { authentik } from "@/oauth/authentik.ts"
import { OAuthEnvSchema, OAuthProviderCredentialsSchema, OpenIDProviderSchema } from "@/schemas.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { createOpenIDPlaceholder } from "@/shared/oidc/resolve-provider.ts"
import { isFalsy } from "@/shared/assert.ts"

export * from "@/oauth/github.ts"
export * from "@/oauth/bitbucket.ts"
export * from "@/oauth/figma.ts"
export * from "@/oauth/discord.ts"
export * from "@/oauth/gitlab.ts"
export * from "@/oauth/spotify.ts"
export * from "@/oauth/x.ts"
export * from "@/oauth/strava.ts"
export * from "@/oauth/mailchimp.ts"
export * from "@/oauth/pinterest.ts"
export * from "@/oauth/twitch.ts"
export * from "@/oauth/notion.ts"
export * from "@/oauth/dropbox.ts"
export * from "@/oauth/atlassian.ts"
export * from "@/oauth/click-up.ts"
export * from "@/oauth/dribbble.ts"
export * from "@/oauth/hubspot.ts"
export * from "@/oauth/google.ts"
export * from "@/oauth/huggingface.ts"
export * from "@/oauth/authentik.ts"

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
    notion,
    dropbox,
    atlassian,
    clickUp,
    dribbble,
    hubspot,
    google,
    huggingface,
    authentik,
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
        clientId: getEnv(`${oauth.replace("-", "_").toUpperCase()}_CLIENT_ID`),
        clientSecret: getEnv(`${oauth.replace("-", "_").toUpperCase()}_CLIENT_SECRET`),
    })
    if (!loadEnvs.success) {
        throw new AuraAuthError({ code: "INVALID_ENVIRONMENT_CONFIGURATION", cause: loadEnvs.error })
    }
    return loadEnvs.data
}

const isOpenIDProvider = (config: BuiltInOAuthProvider | RuntimeOAuthProvider | OpenIDProvider): config is OpenIDProvider => {
    return typeof config === "object" && "issuer" in config && !("accessToken" in config)
}

export const setDynamicParams = <const T extends string, P extends Record<string, unknown>>(
    template: T,
    params: P,
    id: string
): string => {
    return template.replace(/(^|\/):([A-Za-z_][A-Za-z0-9_]*)/g, (_, prefix, key) => {
        const value = getEnv(`${id.replace("-", "_").toUpperCase()}_${key}`) ?? params[key]
        if (isFalsy(value)) {
            throw new AuraAuthError({
                code: "OIDC_INVALID_ISSUER_PARAMS",
                userMessage: `The "${id}" identity provider configuration is invalid. Please check issuer settings and try again.`,
            })
        }
        return `${prefix}${encodeURIComponent(String(value))}`
    })
}

export const defineOpenIDProviderConfig = (config: OpenIDProvider): RuntimeOAuthProvider => {
    const parsed = OpenIDProviderSchema.safeParse(config)
    if (!parsed.success) {
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG", cause: parsed.error })
    }
    const envConfig = !config.clientId || !config.clientSecret ? defineOAuthEnvironment(config.id) : undefined
    config.issuer = setDynamicParams(config.issuer, config, config.id)
    return createOpenIDPlaceholder(config, {
        clientId: config.clientId || envConfig!.clientId,
        clientSecret: config.clientSecret || envConfig!.clientSecret,
    })
}

const defineOAuthProviderConfig = (config: BuiltInOAuthProvider | RuntimeOAuthProvider | OpenIDProvider) => {
    if (typeof config === "string") {
        const definition = defineOAuthEnvironment(config)
        const oauthConfig = builtInOAuthProviders[config]()
        const parsed = OAuthProviderCredentialsSchema.safeParse({ ...oauthConfig, ...definition })
        if (!parsed.success) {
            const openIDParsed = OpenIDProviderSchema.safeParse({ ...oauthConfig, ...definition })
            if (openIDParsed.success) {
                return defineOpenIDProviderConfig(openIDParsed.data as OpenIDProvider)
            }
            throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG", cause: parsed.error })
        }
        return parsed.data
    }
    if (isOpenIDProvider(config)) {
        return defineOpenIDProviderConfig(config)
    }
    const hasCredentials = config.clientId && config.clientSecret
    const envConfig = hasCredentials ? {} : defineOAuthEnvironment(config.id)
    const parsed = OAuthProviderCredentialsSchema.safeParse({ ...envConfig, ...config })
    if (!parsed.success) {
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG", cause: parsed.error })
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
export const createBuiltInOAuthProviders = (
    oauth: (BuiltInOAuthProvider | RuntimeOAuthProvider<any> | OpenIDProvider)[] = []
) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthProviderConfig(config)
        if (oauthConfig.id in previous) {
            throw new AuraAuthError({
                code: "DUPLICATED_OAUTH_PROVIDER_ID",
                cause: new Error(`Duplicate OAuth provider id "${oauthConfig.id}" found. Each provider must have a unique id.`),
            })
        }
        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<BuiltInOAuthProvider>, RuntimeOAuthProvider<any>>
}

export type BuiltInOAuthProvider = keyof typeof builtInOAuthProviders
