import { getProviderTokens } from "./get-provider-tokens.ts"
import type { InternalAuthClient } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@/@types/index.ts"

export const getAccessToken = (client: InternalAuthClient) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<string | null> => {
        const { success, tokens } = await getProviderTokens(client)(oauth)
        return success && tokens ? tokens.accessToken : null
    }
}
