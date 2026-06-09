import { createRouter, type RouterConfig } from "@aura-stack/router"
import { createAuthAPI } from "@/api/createApi.ts"
import { createContext } from "@/router/context.ts"
import { isSecureConnection } from "@/shared/utils.ts"
import { createErrorHandler } from "@/router/errorHandler.ts"
import {
    signInAction,
    signInCredentialsAction,
    callbackAction,
    sessionAction,
    signOutAction,
    csrfTokenAction,
    updateSessionAction,
    signUpAction,
} from "@/actions/index.ts"
import type { EditableShape, Identities, NullableIdentities, UserShape } from "@/shared/identity.ts"
import type { AuthConfig, AuthInstance, FromShapeToObject, SchemaRegistryContext, SignUpConfig } from "@/@types/index.ts"

const createInternalConfig = <Identity extends Identities, SignUpIdentity extends NullableIdentities>(
    config?: AuthConfig<Identity, SignUpIdentity>
): RouterConfig => {
    const context = createContext<Identity, SignUpIdentity>(config)
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

export const createAuthInstance = <Identity extends Identities, SignUpIdentity extends NullableIdentities>(
    authConfig: AuthConfig<Identity, SignUpIdentity>
) => {
    const config = createInternalConfig<Identity, SignUpIdentity>(authConfig)
    const router = createRouter(
        [
            signInAction(config.context.oauth),
            signInCredentialsAction,
            callbackAction(config.context.oauth),
            sessionAction,
            signOutAction,
            csrfTokenAction,
            updateSessionAction(config.context.identity as SchemaRegistryContext),
            signUpAction(config.context.signUp as SignUpConfig<Identity, SignUpIdentity>),
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
export const createAuth = <
    Identity extends Identities = EditableShape<UserShape>,
    SignUpIdentity extends NullableIdentities = undefined,
>(
    config: AuthConfig<Identity, SignUpIdentity>
) => {
    const authInstance = createAuthInstance<Identity, SignUpIdentity>(config) as unknown as AuthInstance<
        FromShapeToObject<Identity>
    >
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
