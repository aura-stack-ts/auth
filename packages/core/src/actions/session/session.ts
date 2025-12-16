import { createEndpoint } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { expireCookie, getCookie, secureCookieOptions } from "@/cookie.js"
import type { OAuthUserProfile } from "@/@types/index.js"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { cookies, jose, trustedProxyHeaders },
    } = ctx
    const cookieOptions = secureCookieOptions(request, cookies, trustedProxyHeaders)
    try {
        const session = getCookie(request, "sessionToken", cookieOptions)
        const decoded = await jose.decodeJWT(session)

        const { exp, iat, jti, nbf, ...user } = decoded as OAuthUserProfile & {
            exp?: number
            iat?: number
            jti?: string
            nbf?: number
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
