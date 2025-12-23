import { createEndpoint } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { toISOString } from "@/utils.js"
import { expiresCookie, unstable__get_cookie } from "@/cookie.js"
import type { JWTStandardClaims, Session, User } from "@/@types/index.js"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { jose, cookies },
    } = ctx
    try {
        const session = unstable__get_cookie(request, cookies.sessionToken.name)
        const decoded = await jose.decodeJWT(session)

        const { exp, iat, jti, nbf, ...user } = decoded as User & JWTStandardClaims
        const headers = new Headers(cacheControl)
        return Response.json({ user, expires: toISOString(exp! * 1000) } as Session, { headers })
    } catch {
        const headers = new Headers(cacheControl)
        const sessionCookie = expiresCookie(cookies.sessionToken.name)
        headers.set("Set-Cookie", sessionCookie)
        return Response.json({ authenticated: false, message: "Unauthorized" }, { status: 401, headers })
    }
})
