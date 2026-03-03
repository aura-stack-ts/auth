import { createEndpoint, HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/headers.ts"
import { expiredCookieAttributes } from "@/cookie.ts"
import { AuthInternalError } from "@/errors.ts"

export const sessionAction = createEndpoint("GET", "/session", async (ctx) => {
    const {
        request,
        context: { server, cookies },
    } = ctx
    try {
        const session = await server.getSession(request)
        if (!session.authenticated) {
            throw new AuthInternalError("INVALID_JWT_TOKEN", "Session not authenticated")
        }
        return Response.json(session, { headers: secureApiHeaders })
    } catch (error) {
        const headers = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookies.sessionToken.name, "", expiredCookieAttributes)
            .toHeaders()
        return Response.json({ session: null, authenticated: false }, { status: 401, headers })
    }
})
