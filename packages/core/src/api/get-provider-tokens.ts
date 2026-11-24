import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
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
    { ctx, request: requestInit, headers: headersInit }: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    try {
        const { rateLimit, provider, rawSession, cookieStore } = await createValidation(ctx, requestInit, headersInit)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/providers/${oauthId}/tokens`)
            .verifyRateLimit("getProviderTokens")
            .verifySession()
            .verifyUserStatus()
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as GetProviderTokensAPIReturn
        }
        const { tokens, headers } = await ctx.session.strategy.getProviderTokens({
            oauthId,
            provider,
            rawSession,
            cookieStore,
            headers: getInitialHeaders(requestInit, headersInit),
        })
        return {
            success: true,
            tokens: tokens,
            headers,
            toResponse: () => {
                return Response.json({ success: true, tokens: tokens }, { headers })
            },
        }
    } catch (error) {
        errorToLogMessage(error, "GET_PROVIDER_TOKENS_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const headers = getAuraAuthHeaders(error, new Headers(secureApiHeaders))

        return {
            success: false,
            tokens: null,
            error: errors,
            headers,
            toResponse: () => Response.json({ success: false, tokens: null }, { status: statusCode, headers }),
        }
    }
}
