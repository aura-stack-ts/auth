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
export const withAuth = <DefaultUser extends User = User>({ api }: AuthInstance<DefaultUser>) => {
    return async ({ request }: { request: Request }): Promise<WithAuthContext<DefaultUser>> => {
        try {
            const { session, authenticated } = await api.getSession({
                headers: request.headers,
            })
            return { session: authenticated ? session : null }
        } catch {
            return { session: null }
        }
    }
}
