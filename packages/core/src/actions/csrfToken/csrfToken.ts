import { createEndpoint } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { useSecureCookies } from "@/utils.js"
import { createCookieStore, setCookie, unstable__get_cookie } from "@/cookie.js"

const getCSRFToken = (request: Request, cookieName: string) => {
    try {
        return unstable__get_cookie(request, cookieName)
    } catch {
        return undefined
    }
}

export const csrfTokenAction = createEndpoint("GET", "/csrfToken", async (ctx) => {
    const {
        request,
        context: { jose, trustedProxyHeaders },
    } = ctx
    const useSecure = useSecureCookies(request, trustedProxyHeaders)
    const cookieStore = createCookieStore(useSecure)

    const token = getCSRFToken(request, cookieStore.csrfToken.name)
    const csrfToken = await createCSRF(jose, token)

    const headers = new Headers(cacheControl)
    headers.append("Set-Cookie", setCookie(cookieStore.csrfToken.name, csrfToken, cookieStore.csrfToken.attributes))
    return Response.json({ csrfToken }, { headers })
})
