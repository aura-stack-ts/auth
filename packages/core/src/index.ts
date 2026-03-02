import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createJoseInstance } from "@/jose.ts"
import { createCookieStore } from "@/cookie.ts"
import { createProxyLogger } from "@/logger.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/env.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import { createErrorHandler, useSecureCookies } from "@/utils.ts"
import { signInAction, callbackAction, sessionAction, signOutAction, csrfTokenAction } from "@/actions/index.ts"
import type { AuthConfig } from "@/@types/index.ts"

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
    Logger,
    LogLevel,
    TrustedOrigin,
    BuiltInOAuthProvider,
    LiteralUnion,
} from "@/@types/index.ts"

export { createClient, type AuthClient, type Client, type ClientOptions } from "@/client.ts"

const createInternalConfig = (authConfig?: AuthConfig): RouterConfig => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (authConfig?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(authConfig)

    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: createErrorHandler(logger),
        context: {
            oauth: createBuiltInOAuthProviders(authConfig?.oauth),
            cookies: createCookieStore(
                useProxyHeaders,
                authConfig?.cookies?.prefix,
                authConfig?.cookies?.overrides ?? {},
                logger
            ),
            jose: createJoseInstance(authConfig?.secret),
            secret: authConfig?.secret,
            basePath: authConfig?.basePath ?? "/auth",
            trustedProxyHeaders: useProxyHeaders,
            trustedOrigins:
                getEnvArray("TRUSTED_ORIGINS").length > 0 ? getEnvArray("TRUSTED_ORIGINS") : authConfig?.trustedOrigins,
            logger,
        },
        use: [
            (ctx) => {
                const useSecure = useSecureCookies(ctx.request, ctx.context.trustedProxyHeaders)
                const cookies = createCookieStore(
                    useSecure,
                    authConfig?.cookies?.prefix,
                    authConfig?.cookies?.overrides ?? {},
                    logger
                )
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
export const createAuth = (authConfig: AuthConfig) => {
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
