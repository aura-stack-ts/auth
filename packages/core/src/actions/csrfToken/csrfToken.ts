import { createEndpoint } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { setCookie, getCookie } from "@/cookie.js"

const getCSRFToken = (request: Request, cookieName: string) => {
    try {
        return getCookie(request, cookieName)
    } catch {
        return undefined
    }
}

export const csrfTokenAction = createEndpoint("GET", "/csrfToken", async (ctx) => {
    const {
        request,
        context: { jose, cookies, logger },
    } = ctx
    const token = getCSRFToken(request, cookies.csrfToken.name)
    const csrfToken = await createCSRF(jose, token)
    logger?.log({
        facility: 4,
        severity: "debug",
        msgId: "CSRF_TOKEN_REQUESTED",
        message: "CSRF token requested",
        structuredData: { has_token: Boolean(token) },
    })
    logger?.log({
        facility: 4,
        severity: "debug",
        msgId: "CSRF_TOKEN_ISSUED",
        message: "Issued new CSRF token",
        structuredData: { issued: Boolean(csrfToken) },
    })
    const headers = new Headers(cacheControl)
    headers.append("Set-Cookie", setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes))
    return Response.json({ csrfToken }, { headers })
})
