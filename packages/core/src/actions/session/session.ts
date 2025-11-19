import { createEndpoint } from "@aura-stack/router"
import { decodeJWT } from "@/jose.js"
import { AuthError } from "@/error.js"
import { cacheControl } from "@/headers.js"
import { expiredCookieOptions, getCookie, setCookie } from "@/cookie.js"
import type { OAuthUserProfile, OAuthUserProfileInternal } from "@/@types/index.js"

export const SESSION_VERSION = "v0.1.0"

export const sessionAction = createEndpoint("GET", "/session", async (request) => {
    try {
        const session = getCookie(request, "sessionToken")
        const decoded = (await decodeJWT(session)) as OAuthUserProfile
        const user: OAuthUserProfileInternal = {
            sub: decoded.sub,
            email: decoded.email,
            name: decoded.name,
            image: decoded.image,
            integrations: (decoded as any).integrations,
            version: (decoded as any).version,
        }
        if (user.version !== SESSION_VERSION) {
            throw new AuthError("session_version", "Session version mismatch")
        }
        const headers = new Headers(cacheControl)
        return Response.json({ user, authenticated: true }, { headers })
    } catch {
        const headers = new Headers(cacheControl)
        const sessionCookie = setCookie("sessionToken", "", expiredCookieOptions)
        headers.set("Set-Cookie", sessionCookie)
        return Response.json({ authenticated: false, message: "Unauthorized" }, { status: 401, headers })
    }
})
