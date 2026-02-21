import { handlers } from "../auth"
import type { Context } from "hono"
import type { Session } from "@aura-stack/auth"

/**
 * Retrieves and validates the session from the request cookies.
 * Uses Hono's built-in getCookie helper and the Aura Auth jose instance.
 */
export const getSession = async (ctx: Context): Promise<Session | null> => {
    try {
        const url = new URL(ctx.req.url)
        url.pathname = "/api/auth/session"
        const response = await handlers.GET(
            new Request(url, {
                headers: ctx.req.raw.headers,
            })
        )
        const sessionToken = await response.json()
        return sessionToken
    } catch {
        return null
    }
}
