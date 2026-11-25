import { isString } from "@/shared/assert.ts"
import type { OAuthTokenPayload } from "@/@types/index.ts"
import type { OAuthAccessTokenResponseType } from "@/@types/internal.ts"

export const shouldRefresh = (payload: OAuthTokenPayload, refreshWindow: number): boolean => {
    if (!payload.accessTokenExpiresAt && !payload.refreshToken) return false
    const now = Math.floor(Date.now() / 1000)
    if (now >= payload.expiresAt) return true
    if (payload.expiresAt - now <= refreshWindow) return true
    return false
}

export const transformToTokenPayload = (tokens: OAuthAccessTokenResponseType & { id_token?: string }) => {
    const now = Math.floor(Date.now() / 1000)
    return {
        accessToken: tokens.access_token,
        expiresAt: tokens.expires_in ? now + tokens.expires_in : undefined,
        refreshToken: tokens.refresh_token,
        refreshTokenExpiresAt: tokens.refresh_token_expires_in ? now + tokens.refresh_token_expires_in : undefined,
        idToken: tokens.id_token,
        tokenType: tokens.token_type ?? "Bearer",
        scopes: isString(tokens.scope) ? [tokens.scope] : Array.isArray(tokens.scope) ? tokens.scope : [],
        issuedAt: now,
    }
}
