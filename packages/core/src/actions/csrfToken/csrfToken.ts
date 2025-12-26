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
        context: { jose, cookies },
    } = ctx
    const token = getCSRFToken(request, cookies.csrfToken.name)
    const csrfToken = await createCSRF(jose, token)

    const headers = new Headers(cacheControl)
    headers.append("Set-Cookie", setCookie(cookies.csrfToken.name, csrfToken, cookies.csrfToken.attributes))
    return Response.json({ csrfToken }, { headers })
})
