import { getEnvArray } from "@/shared/utils/get-env.ts"
import { isString } from "@/shared/assert.ts"
import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, TrustedProxyHeadersSource } from "@/@types/config.ts"

export const getTrustedOriginsConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined,
    proxyHeaders: boolean | TrustedProxyHeadersSource[]
) => {
    const originsFromEnv = getEnvArray("TRUSTED_ORIGINS")
    const origins = originsFromEnv.length > 0 ? originsFromEnv : config?.trustedOrigins
    if (proxyHeaders && (!origins || (Array.isArray(origins) && origins.length === 0))) {
        throw new AuraAuthError({ code: "AUTH_INVALID_PROXY_HEADERS_CONFIG" })
    }
    if (Array.isArray(origins)) {
        origins.forEach((origin) => {
            if (!isString(origin) || !URL.canParse(origin)) {
                throw new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN_VALUE" })
            }
        })
    }
    return origins
}

/**
 * Resolves trusted origins from config (array or function).
 */
export const getTrustedOrigins = async (
    request: Request,
    trustedOrigins: AuthConfig<Identities, SchemaTypes>["trustedOrigins"]
): Promise<string[]> => {
    if (!trustedOrigins) return []
    const raw = typeof trustedOrigins === "function" ? await trustedOrigins(request) : trustedOrigins
    return Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
}
