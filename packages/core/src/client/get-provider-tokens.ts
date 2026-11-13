import { getCSRFToken } from "@/shared/utils/client.ts"
import type { ClientContext } from "@/client/context.ts"
import type { BuiltInOAuthProvider, GetProviderTokensReturn, LiteralUnion } from "@/@types/index.ts"

export const getProviderTokens = (ctx: ClientContext) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<GetProviderTokensReturn> => {
        try {
            const csrfToken = await getCSRFToken(ctx)
            const response = await ctx.client.get("/providers/:oauth/tokens", {
                params: { oauth },
                headers: { "X-CSRF-Token": csrfToken },
            })
            return await response.json()
        } catch (error) {
            console.error("Error getting provider tokens:", error)
            return { success: false, tokens: null } as unknown as GetProviderTokensReturn
        }
    }
}
