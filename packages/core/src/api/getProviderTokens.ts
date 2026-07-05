import { getCookie } from "@/cookie.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { verifyRateLimit } from "@/router/rate-limiter.ts"
import { getBaseURL, getOriginURL } from "@/actions/signIn/authorization.ts"
import { shouldRefresh, toUnionHeaders, verifyCSRFToken } from "@/shared/utils.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { OAuthTokenPayload } from "@/@types/session.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext, GetProviderTokensAPIOptions, GetProviderTokensAPIReturn } from "@/@types/api.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"

export const refreshProviderToken = async (
    payload: OAuthTokenPayload,
    provider: RuntimeOAuthProvider
): Promise<OAuthTokenPayload> => {
    if (!provider.refreshToken || (typeof provider.refreshToken === "object" && !("url" in provider.refreshToken))) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    if (!payload.refreshToken) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    const url = typeof provider.refreshToken === "string" ? provider.refreshToken : provider.refreshToken.url
    const response = await fetchAsync(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(typeof provider.refreshToken === "object" && provider.refreshToken.headers ? provider.refreshToken.headers : {}),
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: payload.refreshToken!,
            client_id: provider.clientId!,
            client_secret: provider.clientSecret!,
            ...(typeof provider.refreshToken === "object" && provider.refreshToken.params ? provider.refreshToken.params : {}),
        }),
    })
    if (!response.ok) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_RESPONSE" })
    }
    const data = await response.json()
    const now = Math.floor(Date.now() / 1000)

    return {
        accessToken: data.access_token ?? payload.accessToken,
        expiresAt: now + (data.expires_in ?? 3600),
        refreshToken: data.refresh_token ?? payload.refreshToken,
        refreshTokenExpiresAt: data.refresh_token_expires_in
            ? now + data.refresh_token_expires_in
            : payload.refreshTokenExpiresAt,
        scopes: typeof data.scope === "string" ? data.scope.split(" ") : payload.scopes,
        tokenType: data.token_type ?? payload.tokenType,
        idToken: data.id_token ?? payload.idToken,
        issuedAt: now,
    }
}

export const getProviderTokens = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit, skipCSRFCheck = false }: FunctionAPIContext<GetProviderTokensAPIOptions>
): Promise<GetProviderTokensAPIReturn> => {
    const { cookies, identity, jwtManager } = ctx
    try {
        const provider = ctx.oauth[oauth]
        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }
        const headers = new Headers(headersInit ?? requestInit?.headers)
        await verifyCSRFToken({
            headers,
            cookies,
            jose: ctx.jose,
            logger: ctx.logger,
            skipCSRFCheck,
        })
        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers })
            const url = `${origin}${ctx.basePath}/token/${oauth}`
            request = new Request(url, { headers })
        }
        await getOriginURL(request, ctx)

        const rateLimit = await verifyRateLimit(ctx, request, "getProviderTokens")
        if (rateLimit) {
            return rateLimit as unknown as GetProviderTokensAPIReturn
        }

        const cookieName = `${cookies.accessToken.name}.${oauth}`
        const cookie = getCookie(request, cookieName)

        const decodedToken = await jwtManager.verifyToken(cookie)
        const tokens = await identity.schemaRegistry.parseOAuthTokens(decodedToken)

        const refreshWindow = provider.refreshWindow ?? 300
        const refreshed = shouldRefresh(tokens, refreshWindow)

        if (refreshed) {
            const refreshedTokens = await refreshProviderToken(tokens, provider)
            const encodedTokens = await jwtManager.createToken(refreshedTokens as unknown as Record<string, unknown>)
            const builder = new HeadersBuilder(secureApiHeaders)
                .setCookie(cookieName, encodedTokens, cookies.accessToken.attributes)
                .toHeaders()
            const newHeaders = toUnionHeaders(builder, headers)
            return {
                success: true,
                tokens: refreshedTokens,
                headers: newHeaders,
                toResponse: () => Response.json({ success: true, tokens: refreshedTokens }, { status: 200, headers: newHeaders }),
            }
        }

        return {
            success: true,
            tokens,
            headers,
            toResponse: () => Response.json({ success: true, tokens }, { status: 200, headers }),
        }
    } catch (error) {
        let code = "PROVIDER_TOKENS_ERROR"
        let message = "Failed to get provider tokens"
        if (isAuraAuthError(error)) {
            message = error.userMessage
            code = error.code
        }
        return {
            success: false,
            tokens: null,
            error: { code, message },
            headers: new Headers(secureApiHeaders),
            toResponse: () => Response.json({ success: false, tokens: null }, { status: 400 }),
        }
    }
}
