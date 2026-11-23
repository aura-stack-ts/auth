import { updateSession as updateSessionHelper } from "@/session/stateful/update-session.ts"
import type { User } from "@/@types/session.ts"
import type { InternalContextForStateful, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User>(
    ctx: InternalContextForStateful
): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = updateSessionHelper<DefaultUser>(ctx)

    return async ({ user, rawSession, sessionToken, cookieStore }) => {
        return await refreshSession({ session: { user }, rawSession, sessionToken, cookieStore })
    }
}
