import { getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, LiteralUnion, Session, User } from "@/@types/index.ts"

export const refreshUserInfo = <DefaultUser extends User = User>(client: InternalAuthClient) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<Session<DefaultUser> | null> => {
        try {
            const csrfToken = await getCSRFToken(client)
            const response = await client.post("/providers/:oauth/user/refresh", {
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
