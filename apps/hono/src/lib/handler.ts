import { Context } from "hono"
import { handlers } from "../auth"

export const toHonoHandler = async (ctx: Context) => {
    const handler = handlers[ctx.req.method as keyof typeof handlers]
    if (!handler) {
        return ctx.json({ error: "Method not supported" }, 405)
    }
    return handler(ctx.req.raw)
}