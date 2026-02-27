import { handlers } from "../auth.ts"
import type { RouterContext } from "@oak/oak"

export const toOakHandler = async (ctx: RouterContext<"/api/auth/(.*)">) => {
    const handler = handlers[ctx.request.method as keyof typeof handlers]
    if (!handler) {
        ctx.response.status = 405
        ctx.response.body = { error: "Method Not Allowed" }
        return
    }
    const toWebRequest = ctx.request.source
    if (!toWebRequest) {
        ctx.response.status = 400
        ctx.response.body = { error: "Bad Request" }
        return
    }
    const response = await handler(toWebRequest)
    const body = await response.json()
    ctx.response.headers = response.headers
    ctx.response.body = body
    if (ctx.response.headers.get("Location")) {
        ctx.response.status = 302
        ctx.response.redirect(ctx.response.headers.get("Location")!)
    }
}
