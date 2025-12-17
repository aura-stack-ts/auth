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

export { github, type GitHubProfile } from "./github.js"
export { bitbucket, type BitbucketProfile } from "./bitbucket.js"
export { figma, type FigmaProfile } from "./figma.js"
export { discord, type DiscordProfile, type Nameplate } from "./discord.js"
export { gitlab, type GitLabProfile } from "./gitlab.js"
export { spotify, type SpotifyProfile } from "./spotify.js"
export { x, type XProfile } from "./x.js"

export const builtInOAuthProviders = {
    github,
    bitbucket,
    figma,
    discord,
    gitlab,
    spotify,
    x,
}

const defineOAuthEnvironment = (oauth: string) => {
    const env = process.env
    return {
        clientId: env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_ID`],
        clientSecret: env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_SECRET`],
    }
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
