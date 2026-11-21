import { secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { OAuthCallbackAPIOptions, OAuthCallbackAPIReturn } from "@/@types/api.ts"

export const oauthCallback = async ({
    ctx,
    payload,
    headers: headersInit,
    request: requestInit,
}: FunctionAPIContext<OAuthCallbackAPIOptions>): Promise<OAuthCallbackAPIReturn> => {
    const { logger } = ctx
    try {
        const { request, rateLimit, provider } = await createValidation(ctx, requestInit, headersInit)
            .verifyOAuthProvider(payload.oauthId)
            .buildRequest(requestInit, `/callback/${payload.oauthId}`)
            .verifyRateLimit("oauthCallback")
            .execute()

        if (rateLimit) {
            return rateLimit
        }
        const { headers } = await ctx.session.strategy.oauthCallback({
            request,
            provider,
            oauthId: payload.oauthId,
            params: { code: payload.code, state: payload.state },
        })

        return {
            success: true,
            headers,
            toResponse: () => {
                return Response.json({ success: true }, { status: 302, headers })
            },
        }
    } catch (error) {
        const headers = new Headers(secureApiHeaders)
        errorToLogMessage(error, "OAUTH_CALLBACK_ERROR", logger)
        const { errors, statusCode } = handleApiError(error, "OAUTH_CALLBACK_ERROR", "An error occurred on callback process")

        return {
            success: false,
            error: errors,
            headers,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        error: errors,
                    },
                    { headers, status: statusCode }
                )
            },
        }
    }
}
