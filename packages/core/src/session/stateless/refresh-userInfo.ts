import { updateSession as updateSessionHelper } from "@/session/stateless/update-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = updateSessionHelper<DefaultUser>(ctx)

    return async ({ headers, user, rawSession, sessionToken }) => {
        return await refreshSession({ headers, session: { user }, rawSession, sessionToken })
    }
}
