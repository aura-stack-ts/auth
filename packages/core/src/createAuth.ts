import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createContext } from "@/context.ts"
import { createAPI } from "@/api/createApi.ts"
import { createErrorHandler, useSecureCookies } from "@/utils.ts"
import { signInAction, callbackAction, sessionAction, signOutAction, csrfTokenAction } from "@/actions/index.ts"
import type { AuthConfig, AuthInstance } from "@/@types/index.ts"

const createInternalConfig = (authConfig?: AuthConfig): RouterConfig => {
    const context = createContext(authConfig)
    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: createErrorHandler(context.logger),
        context,
        use: [
            (ctx) => {
                const useSecure = useSecureCookies(ctx.request, ctx.context.trustedProxyHeaders)
                ctx.context.cookies = useSecure ? context.cookieConfig.secure : context.cookieConfig.standard
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
export const createAuthInstance = (authConfig: AuthConfig) => {
    const config = createInternalConfig(authConfig)
    const router = createRouter(
        [signInAction(config.context.oauth), callbackAction(config.context.oauth), sessionAction, signOutAction, csrfTokenAction],
        config
    )

    return {
        handlers: router,
        jose: config.context.jose,
        api: createAPI(config.context),
    }
}

export const createAuth = (config: AuthConfig) => createAuthInstance(config) as AuthInstance
