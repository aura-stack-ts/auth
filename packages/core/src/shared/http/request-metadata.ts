import type { DeviceType } from "@/@types/entities.ts"
import { createHash } from "@/shared/crypto.ts"

export const getBrowser = (userAgent: string) => {
    if (userAgent.includes("Edg/")) return "Edge"
    if (userAgent.includes("Firefox/")) return "Firefox"
    if (userAgent.includes("Chrome/")) return "Chrome"
    if (userAgent.includes("Safari/")) return "Safari"
    return "Unknown"
}

export const getPlatform = (userAgent: string, secChUaPlatform: string | null) => {
    if (secChUaPlatform) {
        return secChUaPlatform.replace(/"/g, "").trim()
    }
    if (!userAgent) return null
    if (/windows/i.test(userAgent)) return "Windows"
    if (/macintosh|mac os x/i.test(userAgent)) return "macOS"
    if (/android/i.test(userAgent)) return "Android"
    if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS"
    if (/linux/i.test(userAgent)) return "Linux"
    return "Unknown"
}

export const getDeviceType = (userAgent: string, secChUaMobile: string | null): DeviceType => {
    if (secChUaMobile === "?1") return "mobile"
    if (!userAgent) return "unknown"
    if (/ipad|tablet/i.test(userAgent)) return "tablet"
    if (/tv|smarttv|hbbtv|appletv|googletv/i.test(userAgent)) return "tv"
    if (/mobile|iphone|android/i.test(userAgent)) return "mobile"
    if (/bot|crawler|spider|crawling/i.test(userAgent)) return "bot"
    return "desktop"
}

export const getIpAddress = (request: Request): string | null => {
    return (
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        request.headers.get("x-client-ip") ||
        request.headers.get("ip") ||
        null
    )
}

export const createFingerprint = async (request: Request): Promise<string> => {
    const ip = getIpAddress(request) || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    return await createHash(`${ip}:${userAgent}`)
}

export const getDeviceInfo = (request: Request) => {
    const userAgent: string = request.headers.get("user-agent") || ""
    const secChUaPlatform = request.headers.get("sec-ch-ua-platform")
    const secChUaMobile = request.headers.get("sec-ch-ua-mobile")
    const browser = getBrowser(userAgent)
    const platform = getPlatform(userAgent, secChUaPlatform)
    const ip = getIpAddress(request) || "unknown"

    return {
        ip,
        browser,
        platform,
        userAgent,
        name: `${browser} on ${platform}`,
        deviceType: getDeviceType(userAgent, secChUaMobile),
    }
}
