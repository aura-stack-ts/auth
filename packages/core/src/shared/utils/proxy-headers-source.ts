import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { isValidURL } from "@/shared/utils/get-origin-url.ts"
import { isTrustedProxyHeadersSourceURL } from "@/shared/assert.ts"
import type { TrustedProxyHeadersSource } from "@/@types/config.ts"

export const getProtoFromForwarded = (headers: Headers) => {
    return headers?.get("Forwarded")?.match(/proto=([^;]+)/i)?.[1]
}

export const getHostFromForwarded = (headers: Headers) => {
    return headers?.get("Forwarded")?.match(/host=([^;]+)/i)?.[1]
}

/**
 * Extracts the base URL from a set of trusted proxy headers.
 *
 * @param headers - The request headers.
 * @param proxyHeaders - The configured trusted proxy headers.
 * @returns The base URL derived from the proxy headers.
 */
export const getBaseURLFromProxyHeaders = (headers: Headers, proxyHeaders: TrustedProxyHeadersSource[]): string => {
    for (const config of proxyHeaders) {
        try {
            let url: string | null
            if (isTrustedProxyHeadersSourceURL(config)) {
                url =
                    config.url === "forwarded"
                        ? `${getProtoFromForwarded(headers)}://${getHostFromForwarded(headers)}`
                        : headers.get(config.url)
            } else {
                const protocol =
                    config.protocol === "forwarded.proto" ? getProtoFromForwarded(headers) : headers.get(config.protocol)
                const host = config.host === "forwarded.host" ? getHostFromForwarded(headers) : headers.get(config.host)

                if (!protocol || !host) continue
                url = `${protocol}://${host}`
            }
            if (!url || !isValidURL(url)) continue
            return new URL(url).origin
        } catch {
            continue
        }
    }
    throw new AuraAuthError({ code: "INVALID_CUSTOM_TRUSTED_PROXY_HEADERS_CONFIG" })
}
