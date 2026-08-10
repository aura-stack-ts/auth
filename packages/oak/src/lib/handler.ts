import type { RouteParams, RouterContext } from "@oak/oak"
import type { AuthInstance, User } from "@aura-stack/auth"
import type { zod } from "@/identity/zod.ts"
import type { SchemaTypes } from "@aura-stack/auth/types"

export const toSetHeaders = <Route extends string>(ctx: RouterContext<Route>, headers: Headers) => {
    for (const [key, value] of headers.entries()) {
        ctx.response.headers.set(key, value)
    }
}

const isRedirect = (response: Response) => {
    const location = response.headers.get("Location")
    return location !== null && response.status >= 300 && response.status < 400
}

export const toHandler = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>(
    config: AuthInstance<DefaultUser, SignUpSchema>
) => {
    return async <Route extends string>(ctx: RouterContext<Route, RouteParams<Route>>) => {
        const handler = config.handlers[ctx.request.method as keyof typeof config.handlers]
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
}
