import { getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { BuiltInOAuthProvider, LiteralUnion, Session, User } from "@/@types/index.ts"

export const refreshUserInfo = <DefaultUser extends User = User>(ctx: ClientContext) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<Session<DefaultUser> | null> => {
        try {
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.post("/providers/:oauth/user/refresh", {
                params: { oauth },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await response.json()
            return json.session as Session<DefaultUser> | null
        } catch (error) {
            console.error("Error refreshing user info:", error)
            return null
        }
    }
}
