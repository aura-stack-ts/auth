import { createEndpoint } from "@aura-stack/router"
import { decodeJWT } from "@/jose.js"
import { expiredCookieOptions, getCookie, setCookie } from "@/cookie.js"

export const sessionAction = createEndpoint("GET", "/session", async (request) => {
    try {
        const session = getCookie(request, "sessionToken")
        const decoded = await decodeJWT(session as string)
        return Response.json({ session: decoded }, { status: 200 })
    } catch {
        const headers = new Headers()
        const sessionCookie = setCookie("sessionToken", "", expiredCookieOptions)
        headers.set("Set-Cookie", sessionCookie)
        return Response.json({ error: "No session found" }, { status: 401, headers })
    }
})
