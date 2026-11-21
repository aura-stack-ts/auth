import { updateSession as updateSessionHelper } from "@/session/stateless/update-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>(
    ctx: InternalContextForStateless
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = updateSessionHelper<DefaultUser>(ctx)

    return async ({ user, rawSession, sessionToken }) => {
        return await refreshSession({ session: { user }, rawSession, sessionToken })
    }
}
