import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getProviderTokens } from "./getProviderTokens.ts"
import { getUserInfo } from "@/actions/callback/userinfo.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import { toUnionHeaders, createStandardSession } from "@/shared/utils.ts"
import type {
    FunctionAPIContext,
    RefreshUserInfoAPIOptions,
    RefreshUserInfoAPIReturn,
    LiteralUnion,
    User,
    BuiltInOAuthProvider,
} from "@/@types/index.ts"

export const refreshUserInfo = async <DefaultUser extends User = User>(
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit, skipCSRFCheck = false }: FunctionAPIContext<RefreshUserInfoAPIOptions>
): Promise<RefreshUserInfoAPIReturn<DefaultUser>> => {
    const { cookies } = ctx
    try {
        ctx.logger?.log("OAUTH_USERINFO_REQUEST_INITIATED", {
            structuredData: { provider: oauth, skipCSRFCheck },
        })

        const { provider, headers, rateLimit } = await createValidation(ctx, headersInit ?? requestInit?.headers)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck)
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
            skipCSRFCheck,
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

        const sessionToken = await ctx.sessionStrategy.createSession(userInfo)
        const newHeaders = new HeadersBuilder(headers)
            .setCookie(cookies.sessionToken.name, sessionToken, cookies.sessionToken.attributes)
            .toHeaders()

        const mergedHeaders = toUnionHeaders(newHeaders, headers)

        const session = await createStandardSession({
            sessionToken,
            jwt: ctx.jwtManager,
            identity: ctx.identity,
        })
        return {
            success: true,
            headers: mergedHeaders,
            session,
            toResponse: () => {
                return Response.json(
                    {
                        session,
                        success: true,
                    },
                    { headers: mergedHeaders, status: 200 }
                )
            },
        }
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
