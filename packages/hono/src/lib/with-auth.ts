import { createMiddleware } from "hono/factory"
import type { AuthInstance, Session, User } from "@aura-stack/auth"

export type EnvWithSession<DefaultUser extends User = User> = {
    session?: Session<DefaultUser> | null
}

export const withAuth = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return createMiddleware<{ Variables: EnvWithSession<DefaultUser> }>(async (ctx, next) => {
        try {
            const session = await api.getSession({
                headers: ctx.req.raw.headers,
            })
            ctx.set("session", session.session)
            return await next()
        } catch {
            return await next()
        }
    })
}
