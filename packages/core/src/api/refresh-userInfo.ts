import { AuraAuthError } from "@/shared/errors/aura-error.ts"
import { getUserInfo } from "@/shared/oauth2/get-user-info.ts"
import { getProviderTokens } from "@/api/get-provider-tokens.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
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
    context: FunctionAPIContext<RefreshUserInfoAPIOptions>
): Promise<RefreshUserInfoAPIReturn<DefaultUser>> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        const { request, provider, rateLimit, rawSession, sessionToken, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(oauth)
            .buildRequest(`/providers/${oauth}/user/refresh`)
            .verifyRateLimit("refreshUserInfo")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit as RefreshUserInfoAPIReturn<DefaultUser>
        }

        const { success, tokens } = await getProviderTokens(oauth, {
            ctx: context.ctx,
            request,
            headers: getInitialHeaders(context.request, context.headers),
        })
        if (!success) {
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
            context.ctx.logger
        )

        context.ctx.logger?.log("OAUTH_USERINFO_SUCCESS", {
            structuredData: { provider: oauth, userId: userInfo.sub },
        })

        const { session, headers } = await context.ctx.session.strategy.refreshUserInfo({
            rawSession,
            sessionToken,
            user: userInfo,
            cookieStore,
        })
        return toAPIResponse<RefreshUserInfoAPIReturn<DefaultUser>>({
            success: !!session,
            headers,
            session: session,
        })
    } catch (error) {
        errorToLogMessage(error, "REFRESH_USER_INFO_ERROR", context.ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "UNKNOWN_REFRESH_USER_INFO_ERROR",
            "Failed to refresh user information from the OAuth provider"
        )

        const headers = getAuraAuthHeaders(error, initHeaders)
        return toAPIResponse<RefreshUserInfoAPIReturn<DefaultUser>>({
            success: false,
            headers,
            silent: { error: errors },
            session: null,
            status: statusCode,
        })
    }
}
