import { getProviderTokens } from "@/api/get-provider-tokens.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { AccessTokenAPIOptions, AccessTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const getAccessToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<AccessTokenAPIOptions>
): Promise<AccessTokenAPIReturn> => {
    try {
        const output = await getProviderTokens(oauth, ctx)
        const accessToken = output.success ? output.tokens.accessToken : null

        if (!output.success) {
            const statusCode = output.toResponse().status
            return toAPIResponse<AccessTokenAPIReturn>({
                success: false,
                accessToken,
                error: output.error,
                headers: output.headers,
                status: statusCode,
            })
        }
        return toAPIResponse<AccessTokenAPIReturn>({
            success: true,
            accessToken,
            headers: output.headers,
        })
    } catch (error) {
        errorToLogMessage(error, "ACCESS_TOKEN_ERROR", ctx.ctx.logger)
        const { errors } = handleApiError(error, "ACCESS_TOKEN_ERROR", "Failed to get access token")
        const outHeaders = getAuraAuthHeaders(error, new Headers(secureApiHeaders))

        return toAPIResponse<AccessTokenAPIReturn>({
            success: false,
            accessToken: null,
            error: errors,
            headers: outHeaders,
            status: 500,
        })
    }
}
