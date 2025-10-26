import "dotenv/config"
import type { LiteralUnion, OAuthSecureConfig } from "@/@types/index.js"
import { github } from "./github.js"

export { github } from "./github.js"

export const integrations = {
    github,
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

export const createOAuthIntegrations = (oauth: (OAuthIntegrations | OAuthSecureConfig)[] = []) => {
    return oauth.reduce((previous, config) => {
        const oauthConfig = defineOAuthConfig(config)
        return { ...previous, [oauthConfig.id]: oauthConfig }
    }, {}) as Record<LiteralUnion<OAuthIntegrations>, OAuthSecureConfig>
}

export type OAuthIntegrations = keyof typeof integrations
