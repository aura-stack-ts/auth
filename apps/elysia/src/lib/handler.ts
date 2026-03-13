import { handlers } from "../auth"
import type { Context } from "elysia"

export const toElysiaHandler = async (ctx: Context) => {
    return await handlers.ALL(ctx.request)
}
