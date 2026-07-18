import { AuraAuthError } from "@/shared/errors.ts"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import { isObject, isRefreshTokenObject } from "@/shared/assert.ts"
import type { OAuthTokenPayload } from "@/@types/session.ts"
import type { RuntimeOAuthProvider } from "@/@types/oauth.ts"

export const refreshProviderToken = async (
    payload: OAuthTokenPayload,
    provider: RuntimeOAuthProvider
): Promise<OAuthTokenPayload> => {
    if (!provider.refreshToken || (isObject(provider.refreshToken) && !isRefreshTokenObject(provider.refreshToken))) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    if (!payload.refreshToken) {
        throw new AuraAuthError({ code: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG" })
    }
    const url = isRefreshTokenObject(provider.refreshToken) ? provider.refreshToken.url : provider.refreshToken

    const isCredentialsAuth = isRefreshTokenObject(provider.refreshToken)
        ? provider.refreshToken.authorization?.type === "credentials"
        : false
    const response = await fetchAsync(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            ...(isCredentialsAuth ? {} : { Authorization: createBasicAuthHeader(provider.clientId!, provider.clientSecret!) }),
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
