import { toUnionHeaders, toStandardizedHeaders } from "@/shared/http/headers.ts"
import { secureApiHeaders } from "@/shared/http/headers.ts"
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
    const initialHeaders = toStandardizedHeaders(headersInit ?? requestInit?.headers ?? {})
    try {
        const {
            request,
            rateLimit,
            provider,
            session,
            headers: resolvedHeaders,
        } = await createValidation(ctx, initialHeaders)
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
            request,
            provider,
            sessionByToken: session!,
        })
        const updatedHeaders = toUnionHeaders(resolvedHeaders, headers)
        return {
            success: true,
            tokens: tokens,
            headers: updatedHeaders,
            toResponse: () => {
                return Response.json({ success: true, tokens: tokens }, { headers: updatedHeaders })
            },
        }
    } catch (error) {
        errorToLogMessage(error, "GET_PROVIDER_TOKENS_ERROR", ctx.logger)
        const { errors, statusCode } = handleApiError(error, "PROVIDER_TOKENS_ERROR", "Failed to get provider tokens")

        const responseHeaders =
            errors.code === "SESSION_NOT_FOUND" ? toUnionHeaders(ctx.cookies.manager.clear(), initialHeaders) : initialHeaders
        const headers = toUnionHeaders(responseHeaders, secureApiHeaders)
        return {
            success: false,
            tokens: null,
            error: errors,
            headers,
            toResponse: () => Response.json({ success: false, tokens: null }, { status: statusCode, headers }),
        }
    }
}
