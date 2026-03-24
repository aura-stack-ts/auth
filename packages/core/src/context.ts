import { createJoseInstance } from "@/jose.ts"
import { createProxyLogger } from "@/logger.ts"
import { createCookieStore } from "@/cookie.ts"
import { createSessionStrategy } from "@/session/index.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/env.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import type { AuthConfig, InternalContext } from "@/@types/index.ts"

export const createContext = (config?: AuthConfig): InternalContext => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(config)
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const standardCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)
    const jose = createJoseInstance(config?.secret, config?.session)

    const ctx = {
        oauth: createBuiltInOAuthProviders(config?.oauth),
        cookies: standardCookieStore,
        jose,
        secret: config?.secret,
        basePath: config?.basePath ?? "/auth",
        trustedProxyHeaders: useProxyHeaders,
        trustedOrigins: getEnvArray("TRUSTED_ORIGINS").length > 0 ? getEnvArray("TRUSTED_ORIGINS") : config?.trustedOrigins,
        logger,
        cookieConfig: { secure: secureCookieStore, standard: standardCookieStore },
        baseURL: config?.baseURL,
    } as InternalContext
    ctx.sessionStrategy = createSessionStrategy({
        cookies: () => ctx.cookies,
        jose,
        config: config?.session,
        logger: ctx.logger,
    })
    return ctx
}
