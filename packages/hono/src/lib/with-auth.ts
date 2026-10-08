import { createMiddleware } from "hono/factory"
import type { AuthInstance, Session, User } from "@aura-stack/auth"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { SchemaTypes } from "@aura-stack/auth/identity"

export type EnvWithSession<DefaultUser extends User = User> = {
    session?: Session<DefaultUser> | null
}

export const withAuth = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>({
    api,
}: AuthInstance<DefaultUser, SignUpSchema>) => {
    return createMiddleware<{ Variables: EnvWithSession<DefaultUser> }>(async (ctx, next) => {
        try {
            const session = await api.getSession({
                headers: ctx.req.raw.headers,
            })
            ctx.set("session", session.session)
            return await next()
        } catch {
            ctx.set("session", null)
            return await next()
        }
    })
}
