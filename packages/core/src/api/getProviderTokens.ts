import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, errorToLogMessage, handleApiError, toStandardizedHeaders } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type {
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const getProviderTokens = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit }: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    const initialHeaders = toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
    try {
        const { request, rateLimit } = await createValidation(ctx, initialHeaders)
            .verifyOAuthProvider(oauth)
            .buildRequest(requestInit, `/providers/${oauth}/tokens`)
            .verifyRateLimit("getProviderTokens")
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as GetProviderTokensAPIReturn
        }
        const getTokens = await ctx.sessionStrategy.getProviderTokens(oauth, request)
        if (getTokens.success) {
            const { success, tokens, headers } = getTokens
            return {
                success,
                tokens,
                headers,
                toResponse: () => {
                    return Response.json({ success, tokens }, { status: success ? 200 : 400, headers })
                },
            }
        }
        return {
            success: false,
            tokens: null,
            headers: getTokens.headers,
            error: getTokens.error,
            toResponse: () => {
                return Response.json(
                    { success: false, tokens: null },
                    { status: getTokens.statusCode, headers: getTokens.headers }
                )
            },
        }
    } catch (error) {
        errorToLogMessage(error, "GET_PROVIDER_TOKENS_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const headers = toUnionHeaders(initialHeaders, secureApiHeaders)
        return {
            success: false,
            tokens: null,
            error: errors,
            headers,
            toResponse: () => Response.json({ success: false, tokens: null }, { status: statusCode, headers }),
        }
    }
}
