import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ProviderConnectedAPIOptions, ProviderConnectedAPIReturn } from "@/@types/api.ts"

export const isProviderConnected = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    context: FunctionAPIContext<ProviderConnectedAPIOptions>
): Promise<ProviderConnectedAPIReturn> => {
    const headers = new Headers(secureApiHeaders)
    try {
        const { rateLimit, rawSession, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/providers/${oauthId}`)
            .verifyRateLimit("isProviderConnected")
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const connected = await context.ctx.session.strategy.isProviderConnected({
            oauthId,
            cookieStore,
            headers: getInitialHeaders(context.request, context.headers),
            rawSession,
        })

        context.ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
            structuredData: { provider: oauthId, connected },
        })

        return toAPIResponse<ProviderConnectedAPIReturn>({
            success: true,
            connected,
            headers,
        })
    } catch (error) {
        errorToLogMessage(error, "OAUTH_PROVIDER_CONNECTED_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(error, "OAUTH_PROVIDER_CONNECTED_ERROR", "Provider connected error.")

        const outHeaders = getAuraAuthHeaders(error, headers)
        return toAPIResponse<ProviderConnectedAPIReturn>({
            success: false,
            connected: false,
            silent: { error: errors },
            headers: outHeaders,
            status: statusCode,
        })
    }
}
