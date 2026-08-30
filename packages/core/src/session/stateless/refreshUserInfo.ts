import { refreshSession as __refreshSession } from "@/session/stateless/refreshSession.ts"
import type { User } from "@/@types/index.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const refreshSession = __refreshSession<DefaultUser>({ ctx, cookies, cookieManager })
    return async (userInfo: Partial<DefaultUser>, headers: Headers) => {
        const value = await refreshSession(headers, { user: userInfo as DefaultUser })
        return value
    }
}
