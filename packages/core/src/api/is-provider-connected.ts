import { getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ProviderConnectedAPIOptions, ProviderConnectedAPIReturn } from "@/@types/api.ts"

export const isProviderConnected = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit }: FunctionAPIContext<ProviderConnectedAPIOptions>
): Promise<ProviderConnectedAPIReturn> => {
    const headers = getInitialHeaders(requestInit, headersInit)
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: { provider: oauthId, operation: "check_connection" },
        })

        const { rateLimit, session } = await createValidation(ctx, headers)
            .verifyOAuthProvider(oauthId)
            .buildRequest(requestInit, `/providers/${oauthId}`)
            .verifyRateLimit("isProviderConnected")
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit
        }

        const connected = await ctx.session.strategy.isProviderConnected({
            oauthId,
            headers,
            sessionByToken: session!,
        })

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
            structuredData: { provider: oauthId, connected },
        })

        return {
            success: true,
            connected,
            headers,
            toResponse: () => Response.json({ success: true, connected }, { status: 200, headers }),
        }
    } catch (error) {
        errorToLogMessage(error, "OAUTH_PROVIDER_CONNECTED_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "OAUTH_PROVIDER_CONNECTED_ERROR", "")

        const headers = new Headers(secureApiHeaders)
        return {
            success: false,
            connected: false,
            error: errors,
            headers,
            toResponse: () => {
                return Response.json({ success: false, connected: false }, { status: statusCode, headers })
            },
        }
    }
}
