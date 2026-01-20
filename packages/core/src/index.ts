import "dotenv/config"
import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createJoseInstance } from "@/jose.js"
import { createCookieStore } from "@/cookie.js"
import { onErrorHandler, useSecureCookies } from "@/utils.js"
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
    const useSecure = authConfig?.trustedProxyHeaders ?? false

    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: onErrorHandler,
        context: {
            oauth: createBuiltInOAuthProviders(authConfig?.oauth),
            cookies: createCookieStore(useSecure, authConfig?.cookies?.prefix, authConfig?.cookies?.overrides ?? {}),
            jose: createJoseInstance(authConfig?.secret),
            secret: authConfig?.secret,
            basePath: authConfig?.basePath ?? "/auth",
            trustedProxyHeaders: useSecure,
        },
        middlewares: [
            (ctx) => {
                const useSecure = useSecureCookies(ctx.request, ctx.context.trustedProxyHeaders)
                const cookies = createCookieStore(useSecure, authConfig?.cookies?.prefix, authConfig?.cookies?.overrides ?? {})
                ctx.context.cookies = cookies
                return ctx
            },
        ],
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

    /**
     * Return the auth instance with handlers and jose instance.
     * This type is asserted to AuthInstance to ensure correct typing when the package is published on npm.
     * Trust me.
     */
    return {
        handlers: router,
        jose: config.context.jose,
    } as AuthInstance
}
