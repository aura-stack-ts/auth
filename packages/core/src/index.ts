import "dotenv/config"
import { createRouter, type RouterConfig } from "@aura-stack/router"
import { onErrorHandler } from "./utils.js"
import { createJoseInstance } from "@/jose.js"
import { defaultCookieConfig } from "@/cookie.js"
import { createBuiltInOAuthProviders } from "@/oauth/index.js"
import { signInAction, callbackAction, sessionAction, signOutAction, csrfTokenAction } from "@/actions/index.js"
import type { AuthConfig, AuthInstance } from "@/@types/index.js"

export type {
    AuthConfig,
    AuthInstance,
    JoseInstance,
    Session,
    User,
    CookieConfig,
    OAuthProvider,
    OAuthProviderConfig,
    OAuthProviderCredentials,
    ErrorType,
} from "@/@types/index.js"

const createInternalConfig = (authConfig?: AuthConfig): RouterConfig => {
    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: onErrorHandler,
        context: {
            oauth: createBuiltInOAuthProviders(authConfig?.oauth),
            cookies: authConfig?.cookies ?? defaultCookieConfig,
            jose: createJoseInstance(authConfig?.secret),
            basePath: authConfig?.basePath ?? "/auth",
            trustedProxyHeaders: !!authConfig?.trustedProxyHeaders,
        },
    }
}

/**
 * Creates the authentication instance with the configuration provided for OAuth provider.
 * > NOTE: The handlers returned by this function should be used in the server to handle the authentication routes
 * and within the `/auth` base path
 *
 * @param authConfig - Authentication configuration including OAuth provider
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
export const createAuth = (authConfig: AuthConfig): AuthInstance => {
    const config = createInternalConfig(authConfig)
    const router = createRouter(
        [signInAction(config.context.oauth), callbackAction(config.context.oauth), sessionAction, signOutAction, csrfTokenAction],
        config
    )
    return {
        handlers: router,
        jose: config.context.jose,
    }
}
