import { getCSRFToken } from "@/shared/utils/client.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, GetProviderTokensReturn, LiteralUnion } from "@/@types/index.ts"

export const getProviderTokens = (client: InternalAuthClient) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<GetProviderTokensReturn> => {
        try {
            const csrfToken = await getCSRFToken(client)
            const response = await client.get("/providers/:oauth/tokens", {
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
