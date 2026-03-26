import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createAuthAPI } from "@/api/createApi.ts"
import { createContext } from "@/router/context.ts"
import { isSecureConnection } from "@/shared/utils.ts"
import { createErrorHandler } from "@/router/errorHandler.ts"
import {
    signInAction,
    callbackAction,
    sessionAction,
    signOutAction,
    csrfTokenAction,
    updateSessionAction,
} from "@/actions/index.ts"
import type { AuthConfig, AuthInstance, User } from "@/@types/index.ts"

const createInternalConfig = <DefaultUser extends User = User>(authConfig?: AuthConfig<DefaultUser>): RouterConfig => {
    const context = createContext<DefaultUser>(authConfig)
    return {
        basePath: authConfig?.basePath ?? "/auth",
        onError: createErrorHandler(context.logger),
        context: context as unknown as RouterConfig["context"],
        use: [
            (ctx) => {
                const useSecure = isSecureConnection(ctx.request, ctx.context.trustedProxyHeaders)
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
export const createAuthInstance = <DefaultUser extends User = User>(authConfig: AuthConfig<DefaultUser>) => {
    const config = createInternalConfig<DefaultUser>(authConfig)
    const router = createRouter(
        [
            signInAction(config.context.oauth),
            callbackAction(config.context.oauth),
            sessionAction,
            signOutAction,
            csrfTokenAction,
            updateSessionAction,
        ],
        config
    )

    return {
        handlers: router,
        jose: config.context.jose,
        api: createAuthAPI<DefaultUser>(config.context),
    }
}

export const createAuth = <DefaultUser extends User = User>(config: AuthConfig<DefaultUser>) => {
    const authInstance = createAuthInstance<DefaultUser>(config) as unknown as AuthInstance<DefaultUser>
    authInstance.handlers.ALL = async (request: Request) => {
        const method = request.method.toUpperCase()
        const methodHandlers = {
            GET: authInstance.handlers.GET,
            POST: authInstance.handlers.POST,
            PATCH: authInstance.handlers.PATCH,
        } as const
        if (method in methodHandlers) {
            return await methodHandlers[method as keyof typeof methodHandlers](request)
        }
        return new Response("Method Not Allowed", {
            status: 405,
            headers: { Allow: Object.keys(methodHandlers).join(", ") },
        })
    }
    return authInstance
}
