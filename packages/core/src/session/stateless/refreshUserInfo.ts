import { __createSession } from "@/session/stateless/createSession.ts"
import { __refreshSession } from "@/session/stateless/refreshSession.ts"
import type { InternalStatelessContext, User } from "@/@types/session.ts"

export const __refreshUserInfo = <DefaultUser extends User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const refreshSession = __refreshSession({ ctx, cookies, cookieManager })
    return async (userInfo: Partial<DefaultUser>, headers: Headers, skipCSRFCheck?: boolean) => {
        const value = await refreshSession(headers, { user: userInfo }, skipCSRFCheck)
        return value as any
    }
}
