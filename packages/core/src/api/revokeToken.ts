import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, toStandardizedHeaders } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { RevokeTokenAPIOptions, RevokeTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const revokeToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
        disconnect = false,
    }: FunctionAPIContext<RevokeTokenAPIOptions> & { disconnect?: boolean }
): Promise<RevokeTokenAPIReturn> => {
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauth,
                operation: disconnect ? "disconnect" : "revoke",
                skipCSRFCheck: skipCSRFCheck && !!doubleSubmitToken,
            },
        })

        const { headers, rateLimit } = await createValidation(
            ctx,
            toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
        )
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck && !!doubleSubmitToken)
            .buildRequest(requestInit, `/providers/${oauth}/tokens/revoke`)
            .verifyRateLimit("revokeToken")
            .execute()

        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauth, reason: "rate_limit_exceeded" },
            })
            return rateLimit as RevokeTokenAPIReturn
        }

        const revokeHeaders = await ctx.sessionStrategy.revokeToken(oauth, headers, disconnect)
        return {
            success: true,
            headers: revokeHeaders,
            toResponse: () => {
                return Response.json({ success: true }, { status: 200, headers: revokeHeaders })
            },
        }
    } catch (error) {
        errorToLogMessage(error, "REVOKE_TOKEN_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "UNKNOWN_REVOKE_TOKEN_ERROR",
            "Failed to revoke token for the OAuth provider"
        )
        const headers = new Headers(secureApiHeaders)
        return {
            success: false,
            error: errors,
            headers,
            toResponse: () => {
                return Response.json({ success: false }, { status: statusCode, headers })
            },
        }
    }
}
