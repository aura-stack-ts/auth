import { refreshSession as refreshSessionHelper } from "@/session/stateless/refresh-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = refreshSessionHelper<DefaultUser>(ctx)
    return async ({ headers, user }) => {
        const value = await refreshSession({ headers, session: { user } })
        return value
    }
}
