import { refreshSession as __refreshSession } from "@/session/stateless/refresh-session.ts"
import type { DeepPartial, User } from "@/@types/index.ts"
import type { InternalStatelessContext } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User = User>({ ctx, cookies, cookieManager }: InternalStatelessContext) => {
    const refreshSession = __refreshSession<DefaultUser>({ ctx, cookies, cookieManager })
    return async (userInfo: DeepPartial<DefaultUser>, headers: Headers) => {
        const value = await refreshSession(headers, { user: userInfo as DeepPartial<DefaultUser> })
        return value
    }
}
