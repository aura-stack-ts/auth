import { createEndpoint } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { toISOString, useSecureCookies } from "@/utils.js"
import { createCookieStore, expiresCookie, unstable__get_cookie } from "@/cookie.js"
import type { JWTStandardClaims, Session, User } from "@/@types/index.js"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { jose, trustedProxyHeaders },
    } = ctx
    const useSecure = useSecureCookies(request, trustedProxyHeaders)
    const cookieStore = createCookieStore(useSecure)
    try {
        const session = unstable__get_cookie(request, cookieStore.sessionToken.name)
        const decoded = await jose.decodeJWT(session)

        const { exp, iat, jti, nbf, ...user } = decoded as User & JWTStandardClaims
        const headers = new Headers(cacheControl)
        return Response.json({ user, expires: toISOString(exp! * 1000) } as Session, { headers })
    } catch {
        const headers = new Headers(cacheControl)
        const sessionCookie = expiresCookie(cookieStore.sessionToken.name)
        headers.set("Set-Cookie", sessionCookie)
        return Response.json({ authenticated: false, message: "Unauthorized" }, { status: 401, headers })
    }
})
