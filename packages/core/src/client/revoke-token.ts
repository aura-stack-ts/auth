import { getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@/@types/index.ts"

export const revokeToken = (ctx: ClientContext) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<boolean> => {
        try {
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.post("/providers/:oauth/tokens/revoke", {
                params: { oauth },
                headers: { "X-CSRF-Token": csrfToken },
            })
            const json = await response.json()
            return json?.success === true
        } catch (error) {
            console.error("Error revoking token:", error)
            return false
        }
    }
}
