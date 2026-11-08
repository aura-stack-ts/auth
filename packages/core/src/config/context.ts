import { getPrecomputedCookies } from "@/config/cookies.ts"
import { createJoseInstance } from "@/jose.ts"
import { getSaltConfig } from "@/config/get-salt.ts"
import { isStatelessStrategy } from "@/shared/assert.ts"
import { getSecretConfig } from "@/config/get-secret.ts"
import { getMagicLinkConfig } from "./get-magic-links.ts"
import { getBaseURLConfig } from "@/config/get-base-url.ts"
import { getIdentityConfig } from "@/config/get-identity.ts"
import { getBasePathConfig } from "@/config/get-base-path.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createJoseManager } from "@/session/jose-manager.ts"
import { getOAuthProvidersConfig } from "@/config/get-oauth.ts"
import { createCookieManager } from "@/session/cookie-manager.ts"
import { getEmailChangeConfig } from "@/config/get-email-change.ts"
import { getCredentialsConfig } from "@/config/get-credentials.ts"
import { createProxyLogger } from "@/config/logger/create-logger.ts"
import { createRateLimiterInstance } from "@/shared/rate-limiter.ts"
import { getPasswordResetConfig } from "@/config/get-password-reset.ts"
import { getTrustedOriginsConfig } from "@/config/get-trusted-origins.ts"
import { getEmailVerificationConfig } from "@/config/get-email-verification.ts"
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
    const precomputed = getPrecomputedCookies(config, logger)

    const ctx = {
        credentials: getCredentialsConfig(config),
        cookies: {
            store: precomputed.untrusted,
            precomputed,
            manager: createCookieManager(() => ctx.cookies.store),
        },
        jose: {
            instance: jose,
            manager: createJoseManager(isStatelessStrategy(config?.session) ? config?.session?.jwt : undefined, jose),
        },
        secret,
        baseURL: getBaseURLConfig(config),
        basePath: getBasePathConfig(config),
        oauth: getOAuthProvidersConfig(config),
        trustedProxyHeaders: proxyHeaders,
        trustedOrigins: getTrustedOriginsConfig(config, proxyHeaders),
        logger,
        identity: getIdentityConfig(config),
        signUp: config?.signUp,
        emailChange: getEmailChangeConfig(config),
        passwordReset: getPasswordResetConfig(config),
        emailVerification: getEmailVerificationConfig(config),
        magicLinks: getMagicLinkConfig(config),
        rateLimiters: createRateLimiterInstance(config?.rateLimiter, proxyHeadersAsBoolean),
        session: {
            config: config?.session,
        },
    } as InternalContext<Identity, SignUpSchema>
    ctx.session.strategy = createSessionStrategy<Identity>(ctx)
    return ctx
}
