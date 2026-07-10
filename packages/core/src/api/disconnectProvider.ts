import { revokeToken } from "@/api/revokeToken.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { DisconnectProviderAPIOptions, DisconnectProviderAPIReturn, FunctionAPIContext } from "@/@types/api.ts"

export const disconnectProvider = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<DisconnectProviderAPIOptions>
): Promise<DisconnectProviderAPIReturn> => {
    const output = await revokeToken(oauth, { ...ctx, disconnect: true })
    return output as DisconnectProviderAPIReturn
}
