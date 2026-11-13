import { getProviderTokens } from "@/client/get-provider-tokens.ts"
import type { ClientContext } from "@/client/context.ts"
import type { BuiltInOAuthProvider, LiteralUnion } from "@/@types/index.ts"

export const getAccessToken = (context: ClientContext) => {
    return async (oauth: LiteralUnion<BuiltInOAuthProvider>): Promise<string | null> => {
        const { success, tokens } = await getProviderTokens(context)(oauth)
        return success && tokens ? tokens.accessToken : null
    }
}
