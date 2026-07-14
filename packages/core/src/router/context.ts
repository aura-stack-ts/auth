import { createJoseInstance } from "@/jose.ts"
import { createCookieStore } from "@/cookie.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { createProxyLogger } from "@/shared/logger.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/shared/env.ts"
import { createRateLimiterInstance } from "@/router/rate-limiter.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, InternalContext, FromShapeToObject } from "@/@types/index.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"

export const createContext = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config?: AuthConfig<Identity, SignUpSchema>
) => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const envTrustedOrigins = getEnvArray("TRUSTED_ORIGINS")
    const resolvedTrustedOrigins = envTrustedOrigins.length > 0 ? envTrustedOrigins : config?.trustedOrigins
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

    if (
        useProxyHeaders &&
        (!resolvedTrustedOrigins || (Array.isArray(resolvedTrustedOrigins) && resolvedTrustedOrigins.length === 0))
    ) {
        throw new AuraAuthError({ code: "AUTH_INVALID_PROXY_HEADERS_CONFIG" })
    }

    const ctx = {
        oauth: createBuiltInOAuthProviders(config?.oauth),
        credentials: config?.credentials,
        cookies: standardCookieStore,
        jose: jose,
        secret: config?.secret,
        basePath: config?.basePath ?? "/auth",
        trustedProxyHeaders: useProxyHeaders,
        trustedOrigins: resolvedTrustedOrigins,
        logger,
        cookieConfig: { secure: secureCookieStore, standard: standardCookieStore },
        baseURL: config?.baseURL,
        identity: {
            schemaRegistry,
            unknownKeys,
            skipValidation,
        },
        signUp: config?.signUp,
        jwtManager: createJoseManager(isStatelessStrategy(config?.session) ? config?.session?.jwt : undefined, jose),
        rateLimiters: createRateLimiterInstance(config?.rateLimiter),
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
