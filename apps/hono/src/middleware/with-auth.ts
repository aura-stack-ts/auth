import { server } from "../auth"
import { createMiddleware } from "hono/factory"
import type { Session } from "@aura-stack/auth"

/**
 * Type definition for Hono's Context Variables to include the session.
 */
export type AuthVariables = {
    session: Session
}

export const withAuth = createMiddleware<{ Variables: AuthVariables }>(async (ctx, next) => {
    try {
        const session = await server.getSession(ctx.req.raw)
        if (!session.authenticated) {
            return ctx.json({ error: "Unauthorized", message: "Active session required." }, 401)
        }
        ctx.set("session", session.session)
        return await next()
    } catch {
        return ctx.json({ error: "Unauthorized", message: "Active session required." }, 401)
    }
})
