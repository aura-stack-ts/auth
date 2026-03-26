import { createJoseInstance } from "@/jose.ts"
import { createCookieStore } from "@/cookie.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { createProxyLogger } from "@/shared/logger.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/shared/env.ts"
import type { AuthConfig, InternalContext } from "@/@types/index.ts"
import { z, type ZodObject } from "zod"

export const createContext = <DefaultUser extends ZodObject = typeof UserIdentity>(config?: AuthConfig<DefaultUser>) => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(config as any)
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const standardCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)
    const jose = createJoseInstance<DefaultUser & z.infer<typeof UserIdentity>>(config?.secret, config?.session)

    const ctx = {
        oauth: createBuiltInOAuthProviders(config?.oauth),
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
            schema: config?.identity?.schema ?? UserIdentity,
            strict: config?.identity?.strict ?? false,
        },
    } as InternalContext<DefaultUser & z.infer<typeof UserIdentity>>
    ctx.sessionStrategy = createSessionStrategy<DefaultUser & z.infer<typeof UserIdentity>>({
        cookies: () => ctx.cookies,
        jose,
        config: config?.session,
        logger: ctx.logger,
        identity: ctx.identity,
    })
    return ctx
}
