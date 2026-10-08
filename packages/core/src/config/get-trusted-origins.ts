import { getEnvArray } from "@/shared/env.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import type { AuthConfig, TrustedProxyHeadersSource } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getTrustedOriginsConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined,
    proxyHeaders: boolean | TrustedProxyHeadersSource[]
) => {
    const envTrustedOrigins = getEnvArray("TRUSTED_ORIGINS")
    const origins = envTrustedOrigins.length > 0 ? envTrustedOrigins : config?.trustedOrigins

    if (proxyHeaders && (!origins || (Array.isArray(origins) && origins.length === 0))) {
        throw new AuraAuthError({ code: "AUTH_INVALID_PROXY_HEADERS_CONFIG" })
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
