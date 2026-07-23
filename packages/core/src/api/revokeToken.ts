import { AuraAuthError } from "@/shared/errors.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { getCookie, getExpiredCookie } from "@/cookie.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import { createBasicAuthHeader, toUnionHeaders } from "@/shared/utils.ts"
import type {
    FunctionAPIContext,
    RevokeTokenAPIOptions,
    RevokeTokenAPIReturn,
    LiteralUnion,
    BuiltInOAuthProvider,
    RuntimeOAuthProvider,
} from "@/@types/index.ts"

const revokeProviderToken = async (provider: RuntimeOAuthProvider, accessToken: string) => {
    if (!provider.revokeToken || (typeof provider.revokeToken === "object" && !("url" in provider.revokeToken))) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REVOKE_TOKEN_CONFIG" })
    }
    if (!accessToken) {
        throw new AuraAuthError({ code: "INVALID_ACCESS_TOKEN" })
    }
    const { tokenHint: hintParam, ...extraParams } =
        typeof provider.revokeToken === "object" && provider.revokeToken.params
            ? provider.revokeToken.params
            : ({} as Record<string, string>)
    const tokenHint = hintParam ?? "access_token"

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
            ...extraParams,
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
    {
        ctx,
        headers: headersInit,
        request: requestInit,
        skipCSRFCheck = false,
        doubleSubmitToken = undefined,
        disconnect = false,
    }: FunctionAPIContext<RevokeTokenAPIOptions> & { disconnect?: boolean }
): Promise<RevokeTokenAPIReturn> => {
    const { cookies } = ctx
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                provider: oauth,
                operation: disconnect ? "disconnect" : "revoke",
                skipCSRFCheck: skipCSRFCheck || Boolean(doubleSubmitToken),
            },
        })

        const { provider, headers, request, rateLimit } = await createValidation(ctx, headersInit ?? requestInit?.headers)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck || Boolean(doubleSubmitToken))
            .buildRequest(requestInit, `/providers/${oauth}/tokens/revoke`)
            .verifyRateLimit("revokeToken")
            .execute()

        if (rateLimit) {
            ctx.logger?.log("INVALID_REQUEST", {
                structuredData: { provider: oauth, reason: "rate_limit_exceeded" },
            })
            return rateLimit as RevokeTokenAPIReturn
        }

        const cookieName = `${cookies.accessToken.name}.${oauth}`
        const cookie = getCookie(request, cookieName)

        const decodedToken = await ctx.jwtManager.verifyToken(cookie)
        const tokens = await ctx.identity.schemaRegistry.parseOAuthTokens(decodedToken)

        if (!disconnect) {
            ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauth, hasAccessToken: !!tokens.accessToken },
            })

            await revokeProviderToken(provider!, tokens.accessToken)

            ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
                structuredData: { provider: oauth },
            })
        }

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
        const { code, message, statusCode } = handleApiError(
            error,
            "UNKNOWN_REVOKE_TOKEN_ERROR",
            "Failed to revoke token for the OAuth provider"
        )
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
