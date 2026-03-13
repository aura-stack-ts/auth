import { handlers } from "../auth"
import type { Context } from "hono"

/**
 * Bridges the Hono request context to the framework-agnostic Aura Auth handlers.
 * Hono natively uses Web API Request/Response, so we can pass ctx.req.raw directly.
 */
export const toHonoHandler = async (ctx: Context): Promise<Response> => {
    return await handlers.ALL(ctx.req.raw)
}
