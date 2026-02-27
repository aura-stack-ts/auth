import type { RouterContext } from "@oak/oak"

export const toSetHeaders = <Route extends string>(ctx: RouterContext<Route>, headers: Headers) => {
    for (const [key, value] of headers.entries()) {
        ctx.response.headers.set(key, value)
    }
}
