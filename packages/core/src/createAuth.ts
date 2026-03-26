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
import type { AuthConfig, AuthInstance } from "@/@types/index.ts"
import z, { ZodObject, ZodRawShape } from "zod"
import { UserIdentity } from "./shared/identity.ts"

const createInternalConfig = <IdentitySchema extends ZodObject<any> = ZodObject<any>>(
    config?: AuthConfig<IdentitySchema>
): RouterConfig => {
    const context = createContext<IdentitySchema>(config)
    return {
        basePath: config?.basePath ?? "/auth",
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

export const createAuthInstance = <IdentitySchema extends ZodObject<any> = ZodObject<any>>(
    authConfig: AuthConfig<IdentitySchema>
) => {
    const config = createInternalConfig<IdentitySchema>(authConfig)
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
        api: createAuthAPI(config.context),
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
 *     authorize: {
 *       url: "https://custom-oauth.com/oauth/authorize",
 *       params: { responseType: "code", scope: "profile email" },
 *     },
 *     accessToken: "https://custom-oauth.com/oauth/token",
 *     userInfo: "https://custom-oauth.com/api/userinfo",
 *     clientId: process.env.AURA_AUTH_CUSTOM_OAUTH_CLIENT_ID!,
 *     clientSecret: process.env.AURA_AUTH_CUSTOM_OAUTH_CLIENT_SECRET!,
 *   }]
 * })
 */
//export const createAuth = <DefaultUser extends User = User>(config: AuthConfig<DefaultUser>) => {
//export const createAuth = <Config extends AuthConfig<any>>(config: Config) => {
export const createAuth = <IdentitySchema extends ZodObject<ZodRawShape> = typeof UserIdentity>(
    config: AuthConfig<IdentitySchema & typeof UserIdentity>
) => {
    const authInstance = createAuthInstance<IdentitySchema>(config) as AuthInstance<z.infer<typeof UserIdentity>>
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
