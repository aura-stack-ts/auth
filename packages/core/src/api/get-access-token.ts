import { getProviderTokens } from "@/api/get-provider-tokens.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { AccessTokenAPIOptions, AccessTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const getAccessToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<AccessTokenAPIOptions>
): Promise<AccessTokenAPIReturn> => {
    const { success, tokens, headers, toResponse, ...error } = await getProviderTokens(oauth, ctx)
    const status = toResponse().status

    return toAPIResponse<AccessTokenAPIReturn>({
        success,
        headers,
        silent: { ...error },
        accessToken: success ? tokens.accessToken : null,
        status,
    })
}
