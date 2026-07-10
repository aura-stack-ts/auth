import { revokeToken } from "@/api/revokeToken.ts"
import type {
    DisconnectProviderAPIOptions,
    DisconnectProviderAPIReturn,
    FunctionAPIContext,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const disconnectProvider = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<DisconnectProviderAPIOptions>
): Promise<DisconnectProviderAPIReturn> => {
    const output = await revokeToken(oauth, { ...ctx, disconnect: true })
    return output as DisconnectProviderAPIReturn
}
