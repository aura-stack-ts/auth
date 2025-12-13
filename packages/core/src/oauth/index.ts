/**
 * @module OAuthIntegrations
 *
 * This modules re-exports OAuth integrations available in Aura Auth to be used in the Auth instance configuration.
 */
import type { LiteralUnion, OAuthSecureConfig } from "@/@types/index.js"
import { github } from "./github.js"
import { bitbucket } from "./bitbucket.js"
import { figma } from "./figma.js"
import { discord } from "./discord.js"
import { gitlab } from "./gitlab.js"
import { spotify } from "./spotify.js"

export { github } from "./github.js"
export { bitbucket } from "./bitbucket.js"
export { figma } from "./figma.js"
export { discord } from "./discord.js"
export { gitlab } from "./gitlab.js"
export { spotify } from "./spotify.js"

export const integrations = {
    github,
    bitbucket,
    figma,
    discord,
    gitlab,
    spotify,
}

const defineOAuthEnvironment = (oauth: string) => {
    const env = process.env
    return {
        clientId: env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_ID`],
        clientSecret: env[`AURA_AUTH_${oauth.toUpperCase()}_CLIENT_SECRET`],
    }
}

const defineOAuthConfig = (config: OAuthIntegrations | OAuthSecureConfig) => {
    if (typeof config === "string") {
        const definition = defineOAuthEnvironment(config)
        const oauthConfig = integrations[config]
        return {
            ...oauthConfig,
            ...definition,
        }
    }
    return config
}

/**
 * Constructs OAuth integration configurations from an array of integration names or configurations.
 * It loads the client ID and client secret from environment variables if only the integration name is provided.
 *
 * @param oauth - Array of OAuth integration configurations or integration names to be defined from environment variables
 * @returns A record of OAuth integration configurations
 */
export const createOAuthIntegrations = (oauth: (OAuthIntegrations | OAuthSecureConfig)[] = []) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthConfig(config)
        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<OAuthIntegrations>, OAuthSecureConfig>
}

export type OAuthIntegrations = keyof typeof integrations
