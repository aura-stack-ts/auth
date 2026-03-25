import { createEndpoint, HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/lib/headers.ts"
import { AuthInternalError } from "@/lib/errors.ts"
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
        if (headersInit.has("Set-Cookie")) {
            headers.set("Set-Cookie", headersInit.get("Set-Cookie")!)
        }
        return Response.json({ session, authenticated }, { headers })
    } catch {
        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.sessionToken.name, "", { ...cookies.sessionToken.attributes, ...expiredCookieAttributes })
            .toHeaders()
        return Response.json({ session: null, authenticated: false }, { status: 401, headers })
    }
})
