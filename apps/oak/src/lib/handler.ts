import { handlers } from "../auth.ts"
import { toSetHeaders } from "./utils.ts"
import type { RouterContext } from "@oak/oak"

const isRedirect = (response: Response) => {
    const location = response.headers.get("Location")
    return location !== null && response.status >= 300 && response.status < 400
}

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
    if (isRedirect(response)) {
        const location = response.headers.get("Location")!
        ctx.response.status = 302
        toSetHeaders(ctx, response.headers)
        ctx.response.redirect(location)
        return
    }
    const body = await response.json()
    toSetHeaders(ctx, response.headers)
    ctx.response.body = body
}
