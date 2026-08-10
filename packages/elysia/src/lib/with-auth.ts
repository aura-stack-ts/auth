import type { SchemaTypes } from "@/identity"
import type { zod } from "@aura-stack/auth/identity/zod"
import type { AuthInstance, Session, User } from "@aura-stack/auth"

export type WithAuthContext<DefaultUser extends User = User> = {
    session?: Session<DefaultUser> | null
}

/**
 * Utility to be used with Elysia's `.derive()` or `.resolve()` to inject the session into the context.
 *
 * @example
 * const auth = createAuth(...)
 * app.derive(auth.withAuth).get("/me", ({ session }) => session)
 */
export const withAuth = <DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>>({
    api,
}: AuthInstance<DefaultUser, SignUpSchema>) => {
    return async ({ request }: { request: Request }): Promise<WithAuthContext<DefaultUser>> => {
        try {
            const { session, success } = await api.getSession({
                headers: request.headers,
            })
            return { session: success ? session : null }
        } catch {
            return { session: null }
        }
    }
}
