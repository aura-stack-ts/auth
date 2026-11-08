import { refreshSession as refreshSessionHelper } from "@/session/stateful/refresh-session.ts"
import type { User } from "@/@types/session.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User>(
    ctx: InternalContextForStateful
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = refreshSessionHelper<DefaultUser>(ctx)

    return async ({ headers, user }) => {
        const value = await refreshSession({ headers, session: { user } })
        return value as any
    }
}
