import { getEnv } from "@/shared/env.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { setDynamicParams } from "@/shared/utils/params.ts"
import { createOpenIDPlaceholder } from "@/shared/oidc/resolve-provider.ts"
import { builtInOAuthProviders, type BuiltInOAuthProvider } from "@/oauth/index.ts"
import { OAuthEnvSchema, OAuthProviderCredentialsSchema, OpenIDProviderSchema } from "@/shared/schemas/general.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { OpenIDProvider } from "@/@types/oidc.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { RuntimeOAuthProvider } from "@/@types/internal.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

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

export const getOAuthProvidersConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    return createBuiltInOAuthProviders(config?.oauth)
}
