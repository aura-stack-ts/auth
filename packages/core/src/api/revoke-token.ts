import { getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { RevokeTokenAPIOptions, RevokeTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const revokeToken = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
        disconnect = false,
    }: FunctionAPIContext<RevokeTokenAPIOptions> & { disconnect?: boolean }
): Promise<RevokeTokenAPIReturn> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauthId,
                operation: disconnect ? "disconnect" : "revoke",
                skipCSRFCheck: skipCSRFCheck,
                doubleSubmitToken: doubleSubmitToken ? "provided" : "not_provided",
            },
        })

        const { provider, rateLimit, rawSession } = await createValidation(ctx, requestInit, headersInit)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/providers/${oauthId}/tokens/revoke`)
            .verifyRateLimit("revokeToken")
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck, doubleSubmitToken)
            .execute()

        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauthId, reason: "rate_limit_exceeded" },
            })
            return rateLimit as RevokeTokenAPIReturn
        }

        const { headers } = await ctx.session.strategy.revokeToken({
            oauthId,
            provider,
            disconnect,
            headers: getInitialHeaders(requestInit, headersInit),
            rawSession,
        })
        return {
            success: true,
            headers,
            toResponse: () => {
                return Response.json({ success: true }, { status: 200, headers })
            },
        }
    } catch (error) {
        errorToLogMessage(error, "REVOKE_TOKEN_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "UNKNOWN_REVOKE_TOKEN_ERROR",
            "Failed to revoke token for the OAuth provider"
        )
        return {
            success: false,
            error: errors,
            headers: initHeaders,
            toResponse: () => {
                return Response.json({ success: false }, { status: statusCode, headers: initHeaders })
            },
        }
    }
}
