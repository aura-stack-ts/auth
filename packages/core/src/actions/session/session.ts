import { createEndpoint, HeadersBuilder } from "@aura-stack/router"
import { cacheControl } from "@/headers.js"
import { getErrorName, toISOString } from "@/utils.js"
import { expiredCookieAttributes, getCookie } from "@/cookie.js"
import type { JWTStandardClaims, Session, User } from "@/@types/index.js"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { jose, cookies, logger },
    } = ctx
    try {
        const session = getCookie(request, cookies.sessionToken.name)
        const decoded = await jose.decodeJWT(session)
        logger?.log("AUTH_SESSION_VALID")
        const { exp, iat, jti, nbf, ...user } = decoded as User & JWTStandardClaims
        const headers = new Headers(cacheControl)
        return Response.json({ user, expires: toISOString(exp! * 1000) } as Session, { headers })
    } catch (error) {
        logger?.log("AUTH_SESSION_INVALID", { structuredData: { error_type: getErrorName(error) } })
        const headers = new HeadersBuilder(cacheControl)
            .setCookie(cookies.sessionToken.name, "", expiredCookieAttributes)
            .toHeaders()
        return Response.json({ authenticated: false, message: "Unauthorized" }, { status: 401, headers })
    }
})
