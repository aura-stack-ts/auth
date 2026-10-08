import { cookies } from "@/config/cookies.ts"
import { createJoseInstance } from "@/jose.ts"
import { getSaltConfig } from "@/config/get-salt.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"
import { getSecretConfig } from "@/config/get-secret.ts"
import { getBaseURLConfig } from "@/config/get-base-url.ts"
import { getIdentityConfig } from "@/config/get-identity.ts"
import { getBasePathConfig } from "@/config/get-base-path.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { getOAuthProvidersConfig } from "@/config/get-oauth.ts"
import { createProxyLogger } from "@/config/logger/create-logger.ts"
import { createRateLimiterInstance } from "@/shared/rate-limiter.ts"
import { getTrustedOriginsConfig } from "@/config/get-trusted-origins.ts"
import { getTrustedProxyHeadersConfig } from "@/config/get-trusted-proxy-headers.ts"
import type { InternalContext } from "@/@types/internal.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, FromShapeToObject } from "@/@types/index.ts"

export const createContext = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config?: AuthConfig<Identity, SignUpSchema>
) => {
    const { proxyHeaders, proxyHeadersAsBoolean } = getTrustedProxyHeadersConfig(config)
    const secret = getSecretConfig(config)
    const salt = getSaltConfig()
    const logger = createProxyLogger(config)
    const jose = createJoseInstance<FromShapeToObject<Identity>>(secret, salt, config?.session)
    const { trusted, untrusted } = cookies(config, logger)

    const ctx = {
        credentials: config?.credentials,
        cookies: untrusted,
        jose,
        secret,
        baseURL: getBaseURLConfig(config),
        basePath: getBasePathConfig(config),
        oauth: getOAuthProvidersConfig(config),
        trustedProxyHeaders: proxyHeaders,
        trustedOrigins: getTrustedOriginsConfig(config, proxyHeaders),
        logger,
        cookieConfig: { trusted, untrusted },
        identity: getIdentityConfig(config),
        signUp: config?.signUp,
        jwtManager: createJoseManager(isStatelessStrategy(config?.session) ? config?.session?.jwt : undefined, jose),
        rateLimiters: createRateLimiterInstance(config?.rateLimiter, proxyHeadersAsBoolean),
        sessionConfig: config?.session,
    } as InternalContext<Identity, SignUpSchema>
    ctx.sessionStrategy = createSessionStrategy<Identity>({
        ctx,
        cookies: () => ctx.cookies,
    })
    return ctx
}
