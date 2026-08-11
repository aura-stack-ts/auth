import { AuraAuthError } from "@/shared/errors.ts"
import { fetchAsync } from "@/shared/fetch-async.ts"
import { createBasicAuthHeader } from "@/shared/utils.ts"
import type { RuntimeOAuthProvider } from "@/@types/internal.ts"

export const revokeProviderToken = async (provider: RuntimeOAuthProvider, accessToken: string) => {
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
