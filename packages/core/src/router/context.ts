import { createJoseInstance } from "@/jose.ts"
import { createCookieStore } from "@/cookie.ts"
import { createProxyLogger } from "@/shared/logger.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/shared/env.ts"
import type { Identities, SchemaTypes } from "@/shared/identity.ts"
import type { AuthConfig, InternalContext, FromShapeToObject } from "@/@types/index.ts"
import { createJoseManager } from "@/session/jose-manager.ts"

export const createContext = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config?: AuthConfig<Identity, SignUpSchema>
) => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(config)
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const standardCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)
    const jose = createJoseInstance<FromShapeToObject<Identity>>(config?.secret, config?.session)

    const unknownKeys = config?.identity?.unknownKeys ?? "strip"
    const skipValidation = config?.identity?.skipValidation ?? false

    const schemaRegistry = createSchemaRegistry({
        schema: config?.identity?.schema,
        unknownKeys,
        skipValidation,
    })

    const ctx = {
        oauth: createBuiltInOAuthProviders(config?.oauth),
        credentials: config?.credentials,
        cookies: standardCookieStore,
        jose: jose,
        secret: config?.secret,
        basePath: config?.basePath ?? "/auth",
        trustedProxyHeaders: useProxyHeaders,
        trustedOrigins: getEnvArray("TRUSTED_ORIGINS").length > 0 ? getEnvArray("TRUSTED_ORIGINS") : config?.trustedOrigins,
        logger,
        cookieConfig: { secure: secureCookieStore, standard: standardCookieStore },
        baseURL: config?.baseURL,
        identity: {
            schemaRegistry,
            unknownKeys,
            skipValidation,
        },
        signUp: config?.signUp,
        jwtManager: createJoseManager(config?.session?.jwt, jose),
    } as InternalContext<Identity, SignUpSchema>
    ctx.sessionStrategy = createSessionStrategy<Identity>({
        cookies: () => ctx.cookies,
        jose: ctx.jose,
        config: config?.session,
        logger: ctx.logger,
        identity: ctx.identity,
    })
    return ctx
}
