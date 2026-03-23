import { createEndpoint, HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/headers.ts"
import { AuthInternalError } from "@/errors.ts"
import { getSession } from "@/api/getSession.ts"
import { expiredCookieAttributes } from "@/cookie.ts"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { cookies },
    } = ctx
    try {
        const { session, headers: headersInit, authenticated } = await getSession({ ctx: ctx.context, headers: request.headers })
        if (!authenticated) {
            throw new AuthInternalError("INVALID_JWT_TOKEN", "Session not authenticated")
        }
        const headers = new Headers(secureApiHeaders)
        headersInit.forEach((value, key) => headers.append(key, value))
        return Response.json({ session, authenticated }, { headers })
    } catch {
        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.sessionToken.name, "", { ...cookies.sessionToken.attributes, ...expiredCookieAttributes })
            .toHeaders()
        return Response.json({ session: null, authenticated: false }, { status: 401, headers })
    }
})
