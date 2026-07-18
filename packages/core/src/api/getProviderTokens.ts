import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import type {
    FunctionAPIContext,
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const getProviderTokens = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit, skipCSRFCheck = false }: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    const initialHeaders = new Headers(headersInit ?? requestInit?.headers)
    try {
        const { request, rateLimit } = await createValidation(ctx, initialHeaders)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck)
            .buildRequest(requestInit, `/providers/${oauth}/tokens`)
            .verifyRateLimit("getProviderTokens")
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
        const { code, message, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const headers = toUnionHeaders(initialHeaders, secureApiHeaders)
        return {
            success: false,
            tokens: null,
            error: { code, message },
            headers,
            toResponse: () => Response.json({ success: false, tokens: null }, { status: statusCode, headers }),
        }
    }
}
