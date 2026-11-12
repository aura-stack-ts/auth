import { getInitialHeaders, toUnionHeaders } from "@/shared/http/headers.ts"
import { createValidation, errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type {
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    LiteralUnion,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const getProviderTokens = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit }: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    const initHeaders = getInitialHeaders(requestInit, headersInit)
    try {
        const { rateLimit, provider, session } = await createValidation(ctx, initHeaders)
            .verifyOAuthProvider(oauthId)
            .buildRequest(requestInit, `/providers/${oauthId}/tokens`)
            .verifyRateLimit("getProviderTokens")
            .verifySession()
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as GetProviderTokensAPIReturn
        }
        const { tokens, headers } = await ctx.session.strategy.getProviderTokens({
            oauthId,
            provider,
            headers: initHeaders,
            sessionByToken: session!,
        })
        return {
            success: true,
            tokens: tokens,
            headers,
            toResponse: () => {
                return Response.json({ success: true, tokens: tokens }, { headers })
            },
        }
    } catch (error) {
        errorToLogMessage(error, "GET_PROVIDER_TOKENS_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const resolvedHeaders =
            errors.code === "SESSION_NOT_FOUND" ? toUnionHeaders(ctx.cookies.manager.clear(), initHeaders) : initHeaders

        return {
            success: false,
            tokens: null,
            error: errors,
            headers: resolvedHeaders,
            toResponse: () => Response.json({ success: false, tokens: null }, { status: statusCode, headers: resolvedHeaders }),
        }
    }
}
