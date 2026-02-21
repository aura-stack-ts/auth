import type { Context } from "hono"
import { handlers } from "../auth"

/**
 * Bridges the Hono request context to the framework-agnostic Aura Auth handlers.
 * Hono natively uses Web API Request/Response, so we can pass ctx.req.raw directly.
 */
export const toHonoHandler = async (ctx: Context): Promise<Response> => {
    const handler = handlers[ctx.req.method as keyof typeof handlers]
    if (!handler) {
        return ctx.json({ error: "Method Not Allowed" }, 405)
    }
    return handler(ctx.req.raw)
}
