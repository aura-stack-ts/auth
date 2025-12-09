import { createEndpoint } from "@aura-stack/router"
import { createCSRF } from "@/secure.js"
import { cacheControl } from "@/headers.js"
import { getCookie, secureCookieOptions, setCookie } from "@/cookie.js"

export const csrfTokenAction = createEndpoint("GET", "/csrfToken", async (ctx) => {
    const {
        request,
        context: { cookies },
    } = ctx
    const cookieOptions = secureCookieOptions(request, { ...cookies, flag: "host" })

    const existingCSRFToken = getCookie(request, "csrfToken", cookieOptions, true)
    const csrfToken = await createCSRF(existingCSRFToken)

    const headers = new Headers(cacheControl)
    headers.set("Set-Cookie", setCookie("csrfToken", csrfToken, cookieOptions))
    return Response.json({ csrfToken }, { headers })
})
