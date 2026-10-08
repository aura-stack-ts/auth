import { isBoolean } from "@/shared/assert.ts"
import { getEnvBoolean } from "@/shared/env.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getTrustedProxyHeadersConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    const { trustedProxyHeaders } = config ?? {}
    const trustedProxyHeadersEnv = getEnvBoolean("TRUSTED_PROXY_HEADERS")

    const proxyHeaders = trustedProxyHeadersEnv
        ? trustedProxyHeadersEnv
        : Array.isArray(trustedProxyHeaders)
          ? trustedProxyHeaders
          : isBoolean(trustedProxyHeaders)
            ? trustedProxyHeaders
            : false
    return { proxyHeaders, proxyHeadersAsBoolean: Boolean(proxyHeaders) }
}
