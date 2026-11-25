import { getSafeURL } from "@/shared/utils/get-safe-url.ts"
import { getOriginURL } from "@/shared/utils/get-origin-url.ts"
import { getTrustedOrigins } from "@/config/get-trusted-origins.ts"
import type { RouterGlobalContext } from "@/@types/internal.ts"

/**
 * Verifies if the request's origin matches the expected origin. It accepts the redirectTo search
 * parameter for redirection. It checks the Referer and Origin headers and the request URL against
 * the trusted origins list. If they do not match, it returns "/" to avoid potential open redirect attacks.
 *
 * When `trustedOrigins` is provided, URLs are validated against that list. When not provided,
 * the request's derived origin (from request.url or proxy headers) is used as the only trusted origin.
 *
 * @param request The incoming request object
 * @param redirectTo Optional redirectTo parameter to override the referer
 * @param context Global context containing configuration and utilities
 * @returns A safe URL to redirect to after authentication, or "/" if the URL is not considered safe.
 */
export const createRedirectTo = async (
    request: Request,
    redirectTo?: string,
    context?: RouterGlobalContext,
    fallbackRedirectTo?: string
) => {
    try {
        const headers = request.headers
        const baseURL = await getOriginURL(request, context)
        const trustedOrigins = await getTrustedOrigins(request, context?.trustedOrigins)

        const validateURL = (url: string | null | undefined) => {
            if (!url) return null
            const validated = getSafeURL({ baseURL, trustedOrigins, url })
            if (!validated) {
                context?.logger?.log("OPEN_REDIRECT_ATTACK")
            }
            return validated
        }

        const target = redirectTo ?? headers.get("Referer") ?? headers.get("Origin")
        return validateURL(target) || validateURL(fallbackRedirectTo) || validateURL(context?.fallbackRedirectTo) || "/"
    } catch {
        context?.logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED")
        return "/"
    }
}
