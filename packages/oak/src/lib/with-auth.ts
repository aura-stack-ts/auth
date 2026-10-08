import type { Next, RouteParams, RouterContext } from "@oak/oak"
import type { Session, User } from "@aura-stack/auth"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { AuthInstance, SchemaTypes } from "@aura-stack/auth/types"

export interface WithAuthContext<DefaultUser extends User = User> {
    session: Session<DefaultUser> | null
}

export type RouterContextWithAuth<
    Route extends string,
    Params extends RouteParams<Route> = RouteParams<Route>,
    DefaultUser extends User = User,
> = RouterContext<Route, Params, WithAuthContext<DefaultUser>>

export const withAuth = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>(
    config: AuthInstance<DefaultUser, SignUpSchema>
) => {
    return async <Route extends string>(ctx: RouterContextWithAuth<Route, RouteParams<Route>, DefaultUser>, next: Next) => {
        try {
            const session = await config.api.getSession({
                headers: ctx.request.headers,
            })
            ctx.state.session = session.session
            return await next()
        } catch {
            ctx.state.session = null
            return await next()
        }
    }
}
