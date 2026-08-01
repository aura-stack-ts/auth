import { refreshSession as __refreshSession } from "@/session/stateless/refreshSession.ts"
import type { InternalStatelessContext, User } from "@/@types/index.ts"

export const refreshUserInfo = <DefaultUser extends User = User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const refreshSession = __refreshSession<DefaultUser>({ ctx, cookies, cookieManager })
    return async (userInfo: Partial<DefaultUser>, headers: Headers, skipCSRFCheck?: boolean) => {
        const value = await refreshSession(headers, { user: userInfo as DefaultUser }, skipCSRFCheck)
        return value
    }
}
