import { createEndpoint } from "@aura-stack/router"
import { createCSRF } from "@/secure.ts"
import { secureApiHeaders } from "@/headers.ts"
import { setCookie, getCookie } from "@/cookie.ts"

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
    logger?.log("CSRF_TOKEN_REQUESTED", { structuredData: { has_token: Boolean(token) } })
    const csrfToken = await createCSRF(jose, token)
    logger?.log("CSRF_TOKEN_ISSUED", { structuredData: { issued: Boolean(csrfToken) } })

    const headers = new Headers(secureApiHeaders)
    headers.append("Set-Cookie", setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes))
    return Response.json({ csrfToken }, { headers })
})
