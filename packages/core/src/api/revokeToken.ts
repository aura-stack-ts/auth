import { HeadersBuilder } from "@aura-stack/router"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getCookie, getExpiredCookie } from "@/cookie.ts"
import { verifyRateLimit } from "@/router/rate-limiter.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { createBasicAuthHeader, toUnionHeaders, verifyCSRFToken, verifySessionToken } from "@/shared/utils.ts"
import { getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"
import type { FunctionAPIContext, RevokeTokenAPIOptions, RevokeTokenAPIReturn } from "@/@types/api.ts"

const revokeProviderToken = async (provider: RuntimeOAuthProvider, accessToken: string) => {
    if (!provider.revokeToken || (typeof provider.revokeToken === "object" && !("url" in provider.revokeToken))) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REVOKE_TOKEN_CONFIG" })
    }
    if (!accessToken) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REVOKE_TOKEN_CONFIG" })
    }
    const tokenHint =
        typeof provider.revokeToken === "object" ? (provider.revokeToken.params?.tokenHint ?? "access_token") : "access_token"
    const url = typeof provider.revokeToken === "string" ? provider.revokeToken : provider.revokeToken.url
    const basicAuth = createBasicAuthHeader(provider.clientId!, provider.clientSecret!)

    const response = await fetchAsync(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: basicAuth,
            ...(typeof provider.revokeToken === "object" && provider.revokeToken.headers ? provider.revokeToken.headers : {}),
        },
        body: new URLSearchParams({
            token: accessToken,
            token_type_hint: tokenHint,
            ...(typeof provider.revokeToken === "object" && provider.revokeToken.params ? provider.revokeToken.params : {}),
        }),
    })
    if (!response.ok) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REVOKE_TOKEN_RESPONSE" })
    }
    if (response.status !== 200 && response.status !== 204) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REVOKE_TOKEN_PROCESS" })
    }
    return true
}

export const revokeToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit, skipCSRFCheck = false }: FunctionAPIContext<RevokeTokenAPIOptions>
) => {
    const { cookies } = ctx
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: { provider: oauth, operation: "revoke", skipCSRFCheck },
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
            const url = `${origin}${ctx.basePath}/revokeToken/${oauth}`
            request = new Request(url, { headers })
        }
        await getOriginURL(request, ctx)

        const rateLimit = await verifyRateLimit(ctx, request, "revokeToken")
        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauth, reason: "rate_limit_exceeded" },
            })
            return rateLimit as RevokeTokenAPIReturn
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

        const cookieName = `${cookies.accessToken.name}.${oauth}`
        const cookie = getCookie(request, cookieName)

        const decodedToken = await ctx.jwtManager.verifyToken(cookie)
        const tokens = await ctx.identity.schemaRegistry.parseOAuthTokens(decodedToken)

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: { provider: oauth, hasAccessToken: !!tokens.accessToken },
        })

        await revokeProviderToken(provider, tokens.accessToken)

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
            structuredData: { provider: oauth },
        })

        const builder = new HeadersBuilder(secureApiHeaders)
            .setCookie(cookieName, "", getExpiredCookie(cookies.accessToken.attributes))
            .toHeaders()
        const newHeaders = toUnionHeaders(builder, headers)
        return {
            success: true,
            headers: newHeaders,
            toResponse: () => {
                return Response.json({ success: true }, { status: 200, headers: newHeaders })
            },
        }
    } catch (error) {
        let code = "UNKNOWN_REVOKE_TOKEN_ERROR"
        let message = "Failed to revoke token for the OAuth provider"
        let statusCode = 400
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
            statusCode = error.statusCode
        }
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
            structuredData: { provider: oauth, code, errorType: error?.constructor?.name ?? "Unknown" },
        })
        const headers = new Headers(secureApiHeaders)
        return {
            success: false,
            error: { code, message },
            headers,
            toResponse: () => {
                return Response.json({ success: false }, { status: statusCode, headers })
            },
        }
    }
}
