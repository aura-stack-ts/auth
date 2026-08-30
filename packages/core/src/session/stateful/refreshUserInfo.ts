import { refreshSession as __refreshSession } from "@/session/stateful/refreshSession.ts"
import type { User } from "@/@types/index.ts"
import type { InternalStatefulContext } from "@/@types/internal.ts"

export const refreshUserInfo = <DefaultUser extends User>(ctx: InternalStatefulContext) => {
    const refreshSession = __refreshSession(ctx)

    return async (userInfo: Partial<DefaultUser>, headers: Headers) => {
        const value = await refreshSession(headers, { user: userInfo })
        return value as any
    }
}
