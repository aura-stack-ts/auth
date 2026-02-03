import "dotenv/config"
import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createJoseInstance } from "@/jose.js"
import { createCookieStore } from "@/cookie.js"
import { createErrorHandler, useSecureCookies } from "@/utils.js"
import { createBuiltInOAuthProviders } from "@/oauth/index.js"
import { signInAction, callbackAction, sessionAction, signOutAction, csrfTokenAction } from "@/actions/index.js"
import type { AuthConfig, AuthInstance, Logger, LogLevel } from "@/@types/index.js"

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
} from "@/@types/index.js"

/**
 * Maps LogLevel to Severity hierarchically per RFC 5424.
 * Each level includes itself and all more-severe levels.
 */
const logLevelToSeverity: Record<LogLevel, string[]> = {
    debug: ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"],
    info: ["info", "notice", "warning", "error", "critical", "alert", "emergency"],
    warn: ["warning", "error", "critical", "alert", "emergency"],
    error: ["error", "critical", "alert", "emergency"],
}

const createLoggerProxy = (logger?: Logger) => {
    if (!logger) return undefined
    const level = logger.level
    const allowedSeverities = logLevelToSeverity[level] || []

    return {
        level,
        log(args) {
            if (allowedSeverities.includes(args.severity)) {
                logger.log({
                    timestamp: new Date().toISOString(),
                    appName: "aura-auth",
                    hostname: "aura-auth",
                    ...args,
                })
            }
        },
    } as Logger
}

const createInternalConfig = (authConfig?: AuthConfig): RouterConfig => {
    const useSecure = authConfig?.trustedProxyHeaders ?? false
    const logger = authConfig?.logger ?? undefined

    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: createErrorHandler(logger),
        context: {
            oauth: createBuiltInOAuthProviders(authConfig?.oauth),
            cookies: createCookieStore(useSecure, authConfig?.cookies?.prefix, authConfig?.cookies?.overrides ?? {}),
            jose: createJoseInstance(authConfig?.secret),
            secret: authConfig?.secret,
            basePath: authConfig?.basePath ?? "/auth",
            trustedProxyHeaders: useSecure,
            logger: createLoggerProxy(logger),
        },
        middlewares: [
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
