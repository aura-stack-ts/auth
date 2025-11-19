import "dotenv/config"
import { createRouter, type RouterConfig } from "@aura-stack/router"
import { signInAction, callbackAction, sessionAction, signOutAction } from "@/actions/index.js"
import { createOAuthIntegrations } from "@/oauth/index.js"
import type { AuthConfig } from "@/@types/index.js"

const routerConfig: RouterConfig = {
    basePath: "/auth",
}

/**
 * Creates the authentication instance with the configuration provided for OAuth integrations.
 * > NOTE: The handlers returned by this function should be used in the server to handle the authentication routes
 * and within the `/auth` base path
 *
 * @param authConfig - Authentication configuration including OAuth integrations
 * @returns Authentication instance with handlers to be used in the server
 * @example
 * const auth = createAuth({
 *   oauth: ["github", {
 *     id: "custom-oauth",
 *     name: "custom-oauth",
 *     authorizationURL: "https://custom-oauth.com/oauth/authorize",
 *     accessToken: "https://custom-oauth.com/oauth/token",
 *     scope: "profile email",
 *     responseType: "code",
 *     userInfo: "https://custom-oauth.com/api/userinfo",
 *     clientId: process.env.AURA_AUTH_CUSTOM_OAUTH_CLIENT_ID!,
 *     clientSecret: process.env.AURA_AUTH_CUSTOM_OAUTH_CLIENT_SECRET!,
 *   }]
 * })
 */
export const createAuth = (authConfig?: AuthConfig) => {
    const oauth = createOAuthIntegrations(authConfig?.oauth)
    const router = createRouter([signInAction({ oauth }), callbackAction({ oauth }), sessionAction, signOutAction], routerConfig)
    return {
        handlers: router,
    }
}
