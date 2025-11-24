import { createCSRF } from "@/secure.js"
import { createEndpoint } from "@aura-stack/router"
import type { AuthConfigInternal } from "@/@types/index.js"
import { defaultCSRFTokenCookieOptions, getCookie, secureCookieOptions, setCookie } from "@/cookie.js"
import { cacheControl } from "@/headers.js"

export const csrfTokenAction = ({ cookies }: AuthConfigInternal) => {
    return createEndpoint("GET", "/csrfToken", async (request) => {
        const cookieOptions = secureCookieOptions(request, cookies)
        const csrfTokenCookie = getCookie(request, "csrfToken", { ...cookieOptions, ...defaultCSRFTokenCookieOptions })
        const { token, hash } = await createCSRF(csrfTokenCookie)
        const headers = new Headers(cacheControl)
        const csrfToken = setCookie("csrfToken", hash, { ...cookieOptions, ...defaultCSRFTokenCookieOptions })
        headers.set("Set-Cookie", csrfToken)
        return Response.json({ csrfToken: token }, { headers })
    })
}
