import { getCookie } from "@/cookie.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createBasicAuthHeader, shouldRefresh, toUnionHeaders } from "@/shared/utils.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import type {
    FunctionAPIContext,
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    LiteralUnion,
    OAuthTokenPayload,
    BuiltInOAuthProvider,
    RuntimeOAuthProvider,
} from "@/@types/index.ts"
import { isRefreshTokenObject } from "@/shared/assert.ts"

export const refreshProviderToken = async (
    payload: OAuthTokenPayload,
    provider: RuntimeOAuthProvider
): Promise<OAuthTokenPayload> => {
    if (!provider.refreshToken || (isRefreshTokenObject(provider.refreshToken) && !("url" in provider.refreshToken))) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    if (!payload.refreshToken) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    const url = isRefreshTokenObject(provider.refreshToken) ? provider.refreshToken.url : provider.refreshToken
    const basicAuth = createBasicAuthHeader(provider.clientId!, provider.clientSecret!)

    const isCredentialsAuth = isRefreshTokenObject(provider.refreshToken)
        ? provider.refreshToken.authorization?.type === "credentials"
        : false
    const response = await fetchAsync(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(isCredentialsAuth ? {} : { Authorization: basicAuth }),
            ...(typeof provider.refreshToken === "object" && provider.refreshToken.headers ? provider.refreshToken.headers : {}),
        },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: payload.refreshToken!,
            ...(isCredentialsAuth ? { client_id: provider.clientId!, client_secret: provider.clientSecret! } : {}),
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
    const initialHeaders = new Headers(headersInit ?? requestInit?.headers)
    try {
        const { provider, headers, request, rateLimit } = await createValidation(ctx, initialHeaders)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .verifyCSRFToken(skipCSRFCheck)
            .buildRequest(requestInit, `/providers/${oauth}/tokens`)
            .verifyRateLimit("getProviderTokens")
            .execute()

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
            const refreshedTokens = await refreshProviderToken(tokens, provider!)
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
