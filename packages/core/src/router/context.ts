import { createJoseInstance } from "@/jose.ts"
import { createCookieStore } from "@/cookie.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { createProxyLogger } from "@/shared/logger.ts"
import { createSessionStrategy } from "@/session/strategy.ts"
import { createBuiltInOAuthProviders } from "@/oauth/index.ts"
import { getEnv, getEnvArray, getEnvBoolean } from "@/shared/env.ts"
import type { AuthConfig, EditableShape, InternalContext, ShapeToObject, UserShape } from "@/@types/index.ts"

export const createContext = <Identity extends EditableShape<UserShape>>(config?: AuthConfig<Identity>) => {
    const trustedProxyHeadersEnv = getEnv("TRUSTED_PROXY_HEADERS")
    const useProxyHeaders =
        trustedProxyHeadersEnv === undefined ? (config?.trustedProxyHeaders ?? false) : getEnvBoolean("TRUSTED_PROXY_HEADERS")
    const logger = createProxyLogger(config)
    const cookiePrefix = config?.cookies?.prefix
    const cookieOverrides = config?.cookies?.overrides ?? {}
    const secureCookieStore = createCookieStore(true, cookiePrefix, cookieOverrides, logger)
    const standardCookieStore = createCookieStore(false, cookiePrefix, cookieOverrides, logger)
    const jose = createJoseInstance<ShapeToObject<Identity>>(config?.secret, config?.session)

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
            unknownKeys: config?.identity?.unknownKeys ?? "strip",
            skipValidation: config?.identity?.skipValidation ?? false,
        },
    } as InternalContext<Identity>
    ctx.sessionStrategy = createSessionStrategy<Identity>({
        cookies: () => ctx.cookies,
        jose: ctx.jose,
        config: config?.session,
        logger: ctx.logger,
        identity: ctx.identity,
    })
    return ctx
}
