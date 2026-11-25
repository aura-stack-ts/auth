import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type {
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const getProviderTokens = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    context: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    try {
        const { rateLimit, provider, rawSession, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/providers/${oauthId}/tokens`)
            .verifyRateLimit("getProviderTokens")
            .verifySession()
            .verifyUserStatus()
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as GetProviderTokensAPIReturn
        }
        const { tokens, headers } = await context.ctx.session.strategy.getProviderTokens({
            oauthId,
            provider,
            rawSession,
            cookieStore,
            headers: getInitialHeaders(context.request, context.headers),
        })
        return toAPIResponse<GetProviderTokensAPIReturn>({
            success: true,
            tokens,
            headers,
        })
    } catch (error) {
        errorToLogMessage(error, "GET_PROVIDER_TOKENS_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const headers = getAuraAuthHeaders(error, new Headers(secureApiHeaders))
        return toAPIResponse<GetProviderTokensAPIReturn>({
            success: false,
            tokens: null,
            silent: { error: errors },
            headers,
            status: statusCode,
        })
    }
}
