import { fetchAsync } from "@/shared/fetch-async.ts"
import { isOIDCProvider } from "@/shared/oidc/resolve-provider.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { AURA_AUTH_VERSION, getErrorName } from "@/shared/utils.ts"
import { assertContentTypeResponse, isCustomUserInfoFunction } from "@/shared/assert.ts"
import {
    OAuthAccessTokenErrorResponse,
    OAuthAccessTokenResponse,
    OAuthErrorResponse,
    OIDCAccessTokenResponseSchema,
    OIDCUserInfoSchema,
} from "@/schemas.ts"
import type {
    InternalLogger,
    RuntimeOAuthProvider,
    OAuthAccessTokenResponseType,
    AccessTokenContext,
    OIDCAccessTokenResponseType,
    User,
} from "@/@types/index.ts"

/**
 * Make a request to the OAuth provider to the token endpoint to exchange the authorization code provided
 * by the authorization server.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.3
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5
 * @param oauthConfig - OAuth provider configuration
 * @param redirectURI - The redirect URI registered in the Resource Owner's authorization request and sent in the authorization code exchange
 * @param code - The authorization code received from the OAuth server
 * @returns The access token response from the OAuth server
 */
export const createAccessToken = async (
    oauthConfig: RuntimeOAuthProvider,
    redirectURI: string,
    code: string,
    codeVerifier: string,
    logger?: InternalLogger
): Promise<OAuthAccessTokenResponseType & { id_token?: string }> => {
    const { accessToken, clientId, clientSecret } = oauthConfig
    if (!clientId || !clientSecret || !redirectURI || !code || !codeVerifier || !accessToken) {
        logger?.log("INVALID_OAUTH_CONFIGURATION", {
            structuredData: {
                has_client_id: Boolean(clientId),
                has_client_secret: Boolean(clientSecret),
                has_access_token: Boolean(accessToken),
                has_redirect_uri: Boolean(redirectURI),
                has_code: Boolean(code),
                has_code_verifier: Boolean(codeVerifier),
            },
        })
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_URL_CONFIG" })
    }

    const tokenURL = typeof accessToken === "string" ? accessToken : accessToken.url
    const extraHeaders = typeof accessToken === "string" ? undefined : accessToken.headers

    try {
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: {
                has_client_id: Boolean(clientId),
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
            },
        })
        const response = await fetchAsync(tokenURL, {
            method: "POST",
            headers: {
                ...extraHeaders,
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
            }).toString(),
        })
        if (!response.ok) {
            logger?.log("INVALID_OAUTH_ACCESS_TOKEN_RESPONSE")
            throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RESPONSE" })
        }
        assertContentTypeResponse(response, logger)
        const json = await response.json()
        const tokenSchema = isOIDCProvider(oauthConfig) ? OIDCAccessTokenResponseSchema : OAuthAccessTokenResponse
        const token = tokenSchema.safeParse(json)
        if (!token.success) {
            const { success, data } = OAuthAccessTokenErrorResponse.safeParse(json)
            if (!success) {
                logger?.log("INVALID_OAUTH_ACCESS_TOKEN_RESPONSE")
                throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT" })
            }
            logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
                structuredData: {
                    error: data.error,
                    error_description: data.error_description ?? "",
                },
            })
            throw new AuraAuthError({ code: "INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT" })
        }

        logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS")
        return token.data
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_FAILED")
        throw new AuraAuthError({ code: "UNKNOWN_OAUTH_ACCESS_TOKEN_ERROR", cause: error })
    }
}

/**
 * Map the default user information fields from the OAuth provider's userinfo response
 *
 * @param profile - Raw profile object returned by the userinfo endpoint
 * @returns The standardized OAuth user profile
 */
const getDefaultUserInfo = (profile: Record<string, string>): User => {
    const sub = profile?.id ?? profile?.sub ?? profile?.uid ?? profile?.user_id ?? profile?.account_id
    if (!sub) {
        throw new AuraAuthError({ code: "INVALID_USER_INFO" })
    }

    return {
        sub,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.image ?? profile?.picture,
    }
}

type ProviderConfig = {
    userInfo: Exclude<RuntimeOAuthProvider["userInfo"], { request: (context: AccessTokenContext) => any }>
} & Omit<RuntimeOAuthProvider, "userInfo">

const createUserInfoRequest = async (oauthConfig: ProviderConfig, accessToken: string, logger?: InternalLogger) => {
    const userInfoConfig = oauthConfig.userInfo
    const userinfoURL = typeof userInfoConfig === "string" ? userInfoConfig : userInfoConfig.url
    const extraHeaders = typeof userInfoConfig === "string" ? undefined : userInfoConfig.headers
    const method = typeof userInfoConfig === "string" ? "GET" : (userInfoConfig.method ?? "GET").toUpperCase()

    try {
        logger?.log("OAUTH_USERINFO_REQUEST_INITIATED", {
            structuredData: {
                endpoint: userinfoURL,
            },
        })
        const response = await fetchAsync(userinfoURL, {
            method,
            headers: {
                "User-Agent": `Aura Auth/${AURA_AUTH_VERSION}`,
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
                ...extraHeaders,
            },
        })
        if (!response.ok) {
            logger?.log("OAUTH_USERINFO_INVALID_RESPONSE")
            throw new AuraAuthError({ code: "INVALID_OAUTH_USER_INFO_RESPONSE" })
        }

        assertContentTypeResponse(response, logger)
        const json = await response.json()
        const { success, data } = OAuthErrorResponse.safeParse(json)
        if (success) {
            logger?.log("OAUTH_USERINFO_ERROR", {
                message: "Error response received from OAuth userinfo endpoint",
                structuredData: {
                    error: data.error,
                    error_description: data.error_description ?? "",
                },
            })
            throw new AuraAuthError({ code: "INVALID_OAUTH_USER_INFO_RES_FORMAT" })
        }
        logger?.log("OAUTH_USERINFO_SUCCESS")

        return json
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        logger?.log("OAUTH_USERINFO_REQUEST_FAILED")
        throw new AuraAuthError({ code: "UNKNOWN_OAUTH_USER_INFO_ERROR", cause: error })
    }
}

/**
 * Get user information from the OAuth provider's userinfo endpoint using the provided access token.
 * The response by default is mapped to the standardized `User` format unless a custom
 * `profile` function is provided in the `oauthConfig`.
 *
 * @param oauthConfig - OAuth provider configuration
 * @param accessToken - Access Token to access the userinfo endpoint
 * @param logger - Optional logger instance
 * @returns The user information retrieved from the userinfo endpoint
 */
export const getUserInfo = async (
    oauthConfig: RuntimeOAuthProvider,
    accessToken: OAuthAccessTokenResponseType | OIDCAccessTokenResponseType,
    logger?: InternalLogger
) => {
    try {
        let userProfile: Record<string, any> = {}
        if (isCustomUserInfoFunction(oauthConfig.userInfo)) {
            logger?.log("OAUTH_USERINFO_REQUEST_INITIATED", {
                structuredData: {
                    endpoint: oauthConfig.name,
                },
            })
            userProfile = await oauthConfig.userInfo.request({
                accessToken: accessToken.access_token,
                expiresIn: accessToken?.expires_in,
                refreshToken: accessToken?.refresh_token,
                scope: accessToken?.scope,
                tokenType: accessToken?.token_type,
                userInfoURL: oauthConfig.userInfo.url,
            })
        } else {
            userProfile = await createUserInfoRequest(oauthConfig as ProviderConfig, accessToken.access_token, logger)
        }

        if (isOIDCProvider(oauthConfig)) {
            const parsed = OIDCUserInfoSchema.safeParse(userProfile)
            if (!parsed.success) {
                logger?.log("OAUTH_USERINFO_INVALID_RESPONSE")
                throw new AuraAuthError({ code: "OIDC_USERINFO_INVALID_SCHEMA", cause: parsed.error })
            }
            userProfile = parsed.data
        }

        const userInfo = oauthConfig?.profile ? oauthConfig.profile(userProfile) : getDefaultUserInfo(userProfile)
        return userInfo
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        logger?.log("OAUTH_USERINFO_REQUEST_FAILED", { structuredData: { error_type: getErrorName(error) } })
        throw new AuraAuthError({ code: "UNKNOWN_CUSTOM_USER_INFO_ERROR", cause: error })
    }
}
