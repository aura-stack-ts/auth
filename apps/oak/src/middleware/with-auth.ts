import type { Next, RouteParams, RouterContext } from "@oak/oak"
import { getSession } from "../lib/get-session.ts"
import { Session } from "@aura-stack/auth"

const unauthorizedBody = {
    error: "Unauthorized",
    message: "Active session required.",
}

export interface GlobalState {
    session: Session | null
}

export type RouterContextWithState<Route extends string, Params extends RouteParams<Route> = RouteParams<Route>> = RouterContext<
    Route,
    Params,
    GlobalState
>

export const withAuth = async <Route extends string>(ctx: RouterContextWithState<Route>, next: Next) => {
    try {
        const session = await getSession(ctx)
        if (!session) {
            ctx.response.status = 401
            ctx.response.body = unauthorizedBody
            return
        }
        ctx.state.session = session
        return await next()
    } catch {
        ctx.response.status = 401
        ctx.response.body = unauthorizedBody
    }
}
