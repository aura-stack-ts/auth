import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { OAuthCallbackAPIOptions, OAuthCallbackAPIReturn } from "@/@types/api.ts"

export const oauthCallback = async (context: FunctionAPIContext<OAuthCallbackAPIOptions>): Promise<OAuthCallbackAPIReturn> => {
    const { payload, ctx } = context
    try {
        const { request, rateLimit, provider, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(payload.oauthId)
            .buildRequest(`/callback/${payload.oauthId}`)
            .verifyRateLimit("oauthCallback")
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        const { headers } = await ctx.session.strategy.oauthCallback({
            request,
            provider,
            cookieStore,
            oauthId: payload.oauthId,
            params: { code: payload.code, state: payload.state },
        })

        return toAPIResponse<OAuthCallbackAPIReturn>({ success: true, headers, status: 302 })
    } catch (error) {
        const headers = getAuraAuthHeaders(error, new Headers(secureApiHeaders))
        errorToLogMessage(error, "OAUTH_CALLBACK_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "OAUTH_CALLBACK_ERROR", "An error occurred on callback process")

        return toAPIResponse<OAuthCallbackAPIReturn>({
            success: false,
            error: errors,
            headers,
            status: statusCode,
        })
    }
}
