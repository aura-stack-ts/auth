import { createJoseInstance } from "@/jose.ts"
import { createProxyLogger } from "@/logger.ts"
import { createCookieStore } from "@/cookie.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/env.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import type { AuthConfig, CookieStoreConfig } from "@/@types/index.ts"
import type { GlobalContext } from "@aura-stack/router"

export type InternalContext = GlobalContext & {
    cookieConfig: {
        secure: CookieStoreConfig
        standard: CookieStoreConfig
    }
}

export const createContext = (config?: AuthConfig): InternalContext => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(config)
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const standardCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)

    return {
        oauth: createBuiltInOAuthProviders(config?.oauth),
        cookies: standardCookieStore,
        jose: createJoseInstance(config?.secret),
        secret: config?.secret,
        basePath: config?.basePath ?? "/auth",
        trustedProxyHeaders: useProxyHeaders,
        trustedOrigins: getEnvArray("TRUSTED_ORIGINS").length > 0 ? getEnvArray("TRUSTED_ORIGINS") : config?.trustedOrigins,
        logger,
        cookieConfig: { secure: secureCookieStore, standard: standardCookieStore },
    }
}
