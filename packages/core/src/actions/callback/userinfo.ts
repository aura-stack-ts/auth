import { fetchAsync } from "@/request.ts"
import { generateSecure } from "@/secure.ts"
import { AURA_AUTH_VERSION } from "@/utils.ts"
import { OAuthErrorResponse } from "@/schemas.ts"
import { isNativeError, isOAuthProtocolError, OAuthProtocolError } from "@/errors.ts"
import type { InternalLogger, OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * Map the default user information fields from the OAuth provider's userinfo response
 *
 * @param profile - Raw profile object returned by the userinfo endpoint
 * @returns The standardized OAuth user profile
 */
const getDefaultUserInfo = (profile: Record<string, string>): User => {
    const sub = generateSecure(16)

    return {
        sub: profile?.id ?? profile?.sub ?? sub,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.image ?? profile?.picture,
    }
}

/**
 * Get user information from the OAuth provider's userinfo endpoint using the provided access token.
 * The response by default is mapped to the standardized `User` format unless a custom
 * `profile` function is provided in the `oauthConfig`.
 *
 * @param oauthConfig - OAuth provider configuration
 * @param accessToken - Access Token to access the userinfo endpoint
 * @returns The user information retrieved from the userinfo endpoint
 */
export const getUserInfo = async (oauthConfig: OAuthProviderCredentials, accessToken: string, logger?: InternalLogger) => {
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
                ...(extraHeaders ?? {}),
            },
        })
        if (!response.ok) {
            logger?.log("OAUTH_USERINFO_INVALID_RESPONSE")
            throw new OAuthProtocolError("INVALID_REQUEST", "Invalid userinfo response format")
        }

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
            throw new OAuthProtocolError("INVALID_REQUEST", "An error was received from the OAuth userinfo endpoint.")
        }
        logger?.log("OAUTH_USERINFO_SUCCESS")
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch (error) {
        if (isOAuthProtocolError(error)) {
            throw error
        }
        logger?.log("OAUTH_USERINFO_REQUEST_FAILED")
        if (isNativeError(error)) {
            throw new OAuthProtocolError("SERVER_ERROR", "Failed to fetch user information from OAuth provider", "", {
                cause: error,
            })
        }
        throw new OAuthProtocolError("SERVER_ERROR", "Failed to fetch user information", "", { cause: error })
    }
}
