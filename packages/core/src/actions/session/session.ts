import { createEndpoint } from "@aura-stack/router"
import { equals } from "@/utils.js"
import { AuthError } from "@/error.js"
import { cacheControl } from "@/headers.js"
import { expireCookie, getCookie, secureCookieOptions } from "@/cookie.js"
import type { AuthConfigInternal, OAuthUserProfile, OAuthUserProfileInternal } from "@/@types/index.js"

export const SESSION_VERSION = "v0.1.0"

export const sessionAction = ({ cookies, jose }: AuthConfigInternal) => {
    return createEndpoint("GET", "/session", async (request) => {
        const cookieOptions = secureCookieOptions(request, cookies)
        try {
            const session = getCookie(request, "sessionToken", cookieOptions)
            const decoded = (await jose.decodeJWT(session)) as OAuthUserProfile
            const user: OAuthUserProfileInternal = {
                sub: decoded.sub,
                email: decoded.email,
                name: decoded.name,
                image: decoded.image,
                integrations: (decoded as any).integrations,
                version: (decoded as any).version,
            }
            if (!equals(user.version, SESSION_VERSION)) {
                throw new AuthError("session_version", "Session version mismatch")
            }
            const headers = new Headers(cacheControl)
            return Response.json({ user, authenticated: true }, { headers })
        } catch {
            const headers = new Headers(cacheControl)
            const sessionCookie = expireCookie("sessionToken", cookieOptions)
            headers.set("Set-Cookie", sessionCookie)
            return Response.json({ authenticated: false, message: "Unauthorized" }, { status: 401, headers })
        }
    })
}
