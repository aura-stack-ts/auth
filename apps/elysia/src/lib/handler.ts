import { Context } from "elysia"
import { handlers } from "../auth"

export const toElysiaHandler = async (ctx: Context) => {
    const handler = handlers[ctx.request.method as keyof typeof handlers]
    if (!handler) {
        return Response.json({ error: "Method Not Allowed" }, { status: 405 })
    }
    try {
        return await handler(ctx.request)
    } catch (error) {
        console.error("[toElysiaHandler] Unhandled error:", error)
        return Response.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
