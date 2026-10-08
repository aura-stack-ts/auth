import { isBoolean } from "@/shared/assert.ts"
import type { AuthConfig } from "@/@types/config.ts"
import { getBaseURLFromProxyHeaders } from "@/shared/utils/proxy-headers-source.ts"

export const isSecureConnection = (
    request: Request | Headers,
    trustedProxyHeaders: AuthConfig["trustedProxyHeaders"]
): boolean => {
    const headers = request instanceof Headers ? request : request.headers
    const url = request instanceof Headers ? null : request.url
    return isBoolean(trustedProxyHeaders)
        ? trustedProxyHeaders
            ? url?.startsWith("https://") ||
              headers.get("X-Forwarded-Proto") === "https" ||
              (headers.get("Forwarded")?.includes("proto=https") ?? false)
            : (url?.startsWith("https://") ?? false)
        : Array.isArray(trustedProxyHeaders)
          ? getBaseURLFromProxyHeaders(headers, trustedProxyHeaders).startsWith("https://")
          : false
}
