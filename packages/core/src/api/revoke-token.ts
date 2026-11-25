import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { RevokeTokenAPIOptions, RevokeTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const revokeToken = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    context: FunctionAPIContext<RevokeTokenAPIOptions> & { disconnect?: boolean }
): Promise<RevokeTokenAPIReturn> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        const { provider, rateLimit, rawSession, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/providers/${oauthId}/tokens/revoke`)
            .verifyRateLimit("revokeToken")
            .verifySession()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const { headers } = await context.ctx.session.strategy.revokeToken({
            oauthId,
            provider,
            cookieStore,
            disconnect: context.disconnect ?? false,
            headers: getInitialHeaders(context.request, context.headers),
            rawSession,
        })
        return toAPIResponse<RevokeTokenAPIReturn>({ success: true, headers })
    } catch (error) {
        errorToLogMessage(error, "REVOKE_TOKEN_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "UNKNOWN_REVOKE_TOKEN_ERROR",
            "Failed to revoke token for the OAuth provider"
        )
        const headers = getAuraAuthHeaders(error, initHeaders)
        return toAPIResponse<RevokeTokenAPIReturn>({
            success: false,
            silent: { error: errors },
            headers,
            status: statusCode,
        })
    }
}
