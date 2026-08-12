import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, toStandardizedHeaders } from "@/shared/utils/api.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { ProviderConnectedAPIOptions, ProviderConnectedAPIReturn } from "@/@types/api.ts"

export const isProviderConnected = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit }: FunctionAPIContext<ProviderConnectedAPIOptions>
): Promise<ProviderConnectedAPIReturn> => {
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: { provider: oauth, operation: "check_connection" },
        })

        const { headers } = await createValidation(ctx, toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {}))
            .verifyOAuthProvider(oauth)
            .verifySession()
            .buildRequest(requestInit, `/providers/${oauth}`)
            .execute()

        const connected = await ctx.sessionStrategy.isProviderConnected(oauth, headers)

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
            structuredData: { provider: oauth, connected },
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
