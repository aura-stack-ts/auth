import { __refreshSession } from "./refreshSession.ts"
import type { InternalStatefulContext, User } from "@/@types/session.ts"

export const __refreshUserInfo = <DefaultUser extends User>(ctx: InternalStatefulContext) => {
    const refreshSession = __refreshSession(ctx)

    return async (userInfo: Partial<DefaultUser>, headers: Headers, skipCSRFCheck?: boolean) => {
        const value = await refreshSession(headers, { user: userInfo }, skipCSRFCheck)
        return value as any
    }
}
