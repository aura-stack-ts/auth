import { fetchAsync } from "@/shared/fetch-async.ts"
import { AURA_AUTH_VERSION } from "@/shared/utils.ts"
import { OAuthErrorResponse } from "@/schemas.ts"
import type {
    AccessTokenContext,
    InternalLogger,
    OAuthAccessTokenResponseType,
    OAuthProviderCredentials,
    User,
} from "@/@types/index.ts"
import { assertContentTypeResponse, isCustomUserInfoFunction } from "@/shared/assert.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"

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
    userInfo: Exclude<OAuthProviderCredentials["userInfo"], { request: (context: AccessTokenContext) => any }>
} & Omit<OAuthProviderCredentials, "userInfo">

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
    oauthConfig: OAuthProviderCredentials,
    accessToken: OAuthAccessTokenResponseType,
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
        const userInfo = oauthConfig?.profile ? oauthConfig.profile(userProfile) : getDefaultUserInfo(userProfile)
        return userInfo
    } catch (error) {
        if (isAuraAuthError(error)) {
            throw error
        }
        logger?.log("OAUTH_USERINFO_REQUEST_FAILED")
        throw new AuraAuthError({ code: "UNKNOWN_CUSTOM_USER_INFO_ERROR", cause: error })
    }
}
