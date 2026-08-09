import type { Context } from "hono"
import type { Handlers } from "@aura-stack/auth/types"

export const toHandler = (handlers: Handlers) => {
    return async (ctx: Context) => {
        return await handlers.ALL(ctx.req.raw)
    }
}
