import { AuraAuthError } from "@/shared/errors.ts"
import { getUserInfo } from "@/shared/utils/oauth.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getProviderTokens } from "@/api/getProviderTokens.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type {
    RefreshUserInfoAPIOptions,
    RefreshUserInfoAPIReturn,
    LiteralUnion,
    User,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const refreshUserInfo = async <DefaultUser extends User = User>(
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
    }: FunctionAPIContext<RefreshUserInfoAPIOptions>
): Promise<RefreshUserInfoAPIReturn<DefaultUser>> => {
    try {
        const doubleSubmitValidation = skipCSRFCheck && !!doubleSubmitToken
        ctx.logger?.log("OAUTH_USERINFO_REQUEST_INITIATED", {
            structuredData: { provider: oauth, skipCSRFCheck: doubleSubmitValidation },
        })

        const { provider, headers, rateLimit } = await createValidation(ctx, headersInit ?? requestInit?.headers)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(doubleSubmitValidation)
            .buildRequest(requestInit, `/providers/${oauth}/user/refresh`)
            .verifyRateLimit("refreshUserInfo")
            .execute()

        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauth },
            })
            return rateLimit as RefreshUserInfoAPIReturn<DefaultUser>
        }

        const { success, tokens } = await getProviderTokens(oauth, {
            ctx,
            request: requestInit,
            headers: headersInit,
        })
        if (!success) {
            ctx.logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: { provider: oauth },
            })
            throw new AuraAuthError({ code: "INVALID_ACCESS_TOKEN_RETRIEVING_REFRESH_USER_INFO" })
        }

        const expiresIn = tokens?.expiresAt
            ? Math.max(0, Math.floor(tokens.expiresAt - Math.floor(Date.now() / 1000)))
            : undefined

        const userInfo = await getUserInfo(
            provider!,
            {
                access_token: tokens.accessToken,
                expires_in: expiresIn,
                refresh_token: tokens?.refreshToken,
                id_token: tokens?.idToken,
                scope: tokens?.scopes?.join(" "),
                token_type: tokens?.tokenType,
            },
            ctx.logger
        )

        ctx.logger?.log("OAUTH_USERINFO_SUCCESS", {
            structuredData: { provider: oauth, userId: userInfo.sub },
        })

        const { session, headers: newHeaders } = await ctx.sessionStrategy.refreshUserInfo(
            userInfo,
            headers,
            doubleSubmitValidation
        )
        return {
            success: !!session,
            headers: newHeaders,
            session: session,
            toResponse: () => {
                return Response.json(
                    {
                        success: !!session,
                        session,
                    },
                    { headers: newHeaders, status: 200 }
                )
            },
        } as RefreshUserInfoAPIReturn<DefaultUser>
    } catch (error) {
        const { code, message, statusCode } = handleApiError(
            error,
            "UNKNOWN_REFRESH_USER_INFO_ERROR",
            "Failed to refresh user information from the OAuth provider"
        )
        const newHeaders = new Headers(secureApiHeaders)
        return {
            success: false,
            headers: newHeaders,
            error: { code, message },
            session: null,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        session: null,
                    },
                    { headers: newHeaders, status: statusCode }
                )
            },
        }
    }
}
