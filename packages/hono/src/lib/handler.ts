import type { Context } from "hono"
import type { AuthInstance } from "@aura-stack/auth"

export const toHandler = async (handlers: AuthInstance["handlers"], ctx: Context) => {
    return await handlers.ALL(ctx.req.raw)
}
