import { getProviderTokens } from "@/api/getProviderTokens.ts"
import type { AccessTokenAPIOptions, AccessTokenAPIReturn, FunctionAPIContext } from "@/@types/api.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"

export const getAccessToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<AccessTokenAPIOptions>
): Promise<AccessTokenAPIReturn> => {
    const output = await getProviderTokens(oauth, ctx)
    const accessToken = output.success ? output.tokens.accessToken : null

    if (!output.success) {
        const statusCode = output.toResponse().status
        return {
            success: false,
            accessToken,
            error: output.error,
            headers: output.headers,
            toResponse: () => Response.json({ success: false, accessToken }, { status: statusCode, headers: output.headers }),
        } as AccessTokenAPIReturn
    }
    return {
        success: true,
        accessToken,
        headers: output.headers,
        toResponse: () => Response.json({ success: true, accessToken }, { status: 200, headers: output.headers }),
    } as AccessTokenAPIReturn
}
