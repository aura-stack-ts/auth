import { refreshSession as __refreshSession } from "@/session/stateless/refresh-session.ts"
import type { User } from "@/@types/index.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>({
    ctx,
    cookies,
    cookieManager,
}: InternalStatelessContext): SessionStrategy<DefaultUser>["refreshUserInfo"] => {
    const refreshSession = __refreshSession<DefaultUser>({ ctx, cookies, cookieManager })
    return async ({ headers, user }) => {
        const value = await refreshSession({ headers, session: { user } })
        return value
    }
}
