import { getEnv } from "@/shared/env.ts"
import { AuraAuthError } from "@/errors/aura-error.ts"
import { getBaseURLFromProxyHeaders, getHostFromForwarded, getProtoFromForwarded } from "@/shared/utils/proxy-headers-source.ts"
import type { AuthConfig } from "@/@types/config.ts"
import type { GlobalContext } from "@aura-stack/router/types"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

export const getBaseURLConfig = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config: AuthConfig<Identity, SignUpSchema> | undefined
) => {
    return config?.baseURL
}

export const getBaseURL = async ({
    ctx,
    request,
    headers: headersInit,
}: {
    ctx?: GlobalContext
    request?: Request
    headers?: HeadersInit
}) => {
    const origin = getEnv("BASE_URL") || ctx?.baseURL
    if (origin && origin !== "/") return origin
    if (ctx?.trustedProxyHeaders) {
        const headers = new Headers(request?.headers ?? headersInit ?? {})
        if (Array.isArray(ctx.trustedProxyHeaders)) {
            return getBaseURLFromProxyHeaders(headers, ctx.trustedProxyHeaders)
        }
        const protocol = getProtoFromForwarded(headers) ?? headers?.get("X-Forwarded-Proto") ?? "http"
        const host = headers?.get("Host") ?? getHostFromForwarded(headers) ?? headers?.get("X-Forwarded-Host") ?? null
        if (host) return `${protocol}://${host}`
        throw new AuraAuthError({ code: "INVALID_AUTH_CONFIGURATION" })
    }
    try {
        return new URL(request?.url ?? "not-found").origin
    } catch (cause) {
        throw new AuraAuthError({ code: "INVALID_AUTH_CONFIGURATION", cause })
    }
}

export const getBaseURLFromRequest = (request: Request) => {
    const url = new URL(request.url)
    return `${url.origin}${url.pathname}`
}
