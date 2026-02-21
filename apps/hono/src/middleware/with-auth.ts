import { createMiddleware } from "hono/factory"
import { getSession } from "../lib/get-session"
import type { Session } from "@aura-stack/auth"

/**
 * Type definition for Hono's Context Variables to include the session.
 */
export type AuthVariables = {
    session: Session
}

export const withAuth = createMiddleware<{ Variables: AuthVariables }>(async (ctx, next) => {
    const session = await getSession(ctx)
    if (!session) {
        return ctx.json({ error: "Unauthorized", message: "Active session required." }, 401)
    }
    ctx.set("session", session)
    return await next()
})
