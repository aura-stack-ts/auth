import { handlers } from "../auth"
import type { Context } from "hono"
import type { Session } from "@aura-stack/auth"

/**
 * Retrieves the current session by forwarding the incoming request headers
 * to the Aura Auth /api/auth/session handler and parsing the response.
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
