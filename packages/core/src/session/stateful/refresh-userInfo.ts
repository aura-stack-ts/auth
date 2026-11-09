import { refreshSession as __refreshSession } from "@/session/stateful/refresh-session.ts"
import type { User } from "@/@types/session.ts"
import type { InternalStatefulContext, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User>(
    ctx: InternalStatefulContext
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = __refreshSession<DefaultUser>(ctx)

    return async ({ headers, user }) => {
        const value = await refreshSession({ headers, session: { user } })
        return value as any
    }
}
