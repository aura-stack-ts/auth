import { HeadersBuilder } from "@aura-stack/router"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getProviderTokens } from "./getProviderTokens.ts"
import { getUserInfo } from "@/actions/callback/userinfo.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { verifyCSRFToken, verifySessionToken, toUnionHeaders } from "@/shared/utils.ts"
import { verifyRateLimit } from "@/router/rate-limiter.ts"
import { getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { Session, User } from "@/@types/session.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext, RefreshUserInfoAPIOptions, RefreshUserInfoAPIReturn } from "@/@types/api.ts"

export const refreshUserInfo = async <DefaultUser extends User = User>(
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit, skipCSRFCheck = false }: FunctionAPIContext<RefreshUserInfoAPIOptions>
): Promise<RefreshUserInfoAPIReturn<DefaultUser>> => {
    const { cookies } = ctx
    try {
        ctx.logger?.log("OAUTH_USERINFO_REQUEST_INITIATED", {
            structuredData: { provider: oauth, skipCSRFCheck },
        })

        const provider = ctx.oauth[oauth]
        if (!provider) {
            ctx.logger?.log("INVALID_OAUTH_CONFIGURATION", {
                structuredData: { provider: oauth },
            })
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }
        const headers = new Headers(headersInit ?? requestInit?.headers)
        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers })
            const url = `${origin}${ctx.basePath}/session`
            request = new Request(url, { headers })
        }
        await getOriginURL(request, ctx)

        const rateLimit = await verifyRateLimit(ctx, request, "refreshUserInfo")
        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauth },
            })
            return rateLimit as RefreshUserInfoAPIReturn<DefaultUser>
        }

        await verifySessionToken({
            headers,
            cookies,
            jwt: ctx.jwtManager,
            logger: ctx.logger,
        })
        await verifyCSRFToken({
            headers,
            cookies,
            jose: ctx.jose,
            logger: ctx.logger,
            skipCSRFCheck,
        })

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
            ? Math.max(0, Math.floor(((tokens.expiresAt as number) - Date.now()) / 1000))
            : undefined

        const userInfo = await getUserInfo(
            provider,
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

        const decodedSession = await ctx.jwtManager.verifyToken(sessionToken)
        return {
            success: true,
            headers: mergedHeaders,
            session: decodedSession as unknown as Session<DefaultUser>,
            toResponse: () => {
                return Response.json(
                    {
                        success: true,
                        session: decodedSession,
                    },
                    { headers: mergedHeaders, status: 200 }
                )
            },
        }
    } catch (error) {
        let code = "UNKNOWN_REFRESH_USER_INFO_ERROR"
        let message = "Failed to refresh user information from the OAuth provider"
        let statusCode = 400
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
            statusCode = error.statusCode
        }
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
