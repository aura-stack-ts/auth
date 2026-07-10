import { revokeToken } from "@/api/revokeToken.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext, RevokeTokenAPIOptions } from "@/@types/api.ts"

export const disconnectProvider = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<RevokeTokenAPIOptions>
) => {
    return await revokeToken(oauth, { ...ctx, disconnect: true })
}
