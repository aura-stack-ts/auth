import { fetchAsync } from "@/request.js"
import { generateSecure } from "@/secure.js"
import { OAuthErrorResponse } from "@/schemas.js"
import { isNativeError, isOAuthProtocolError, OAuthProtocolError } from "@/errors.js"
import type { Logger, OAuthProviderCredentials, User } from "@/@types/index.js"

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
export const getUserInfo = async (oauthConfig: OAuthProviderCredentials, accessToken: string, logger?: Logger) => {
    const userinfoEndpoint = oauthConfig.userInfo
    try {
        const response = await fetchAsync(userinfoEndpoint, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        })
        const json = await response.json()
        const { success } = OAuthErrorResponse.safeParse(json)
        if (success) {
            logger?.log({
                facility: 10,
                severity: "error",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "OAUTH_USERINFO_ERROR",
                message: "Error response received from OAuth userinfo endpoint",
            })
            throw new OAuthProtocolError(
                "OAUTH_USERINFO_ERROR",
                "An error was received from the OAuth userinfo endpoint.",
            )
        }
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch (error) {
        if (isOAuthProtocolError(error)) {
            throw error
        }
        if (isNativeError(error)) {
            throw new OAuthProtocolError("invalid_request", error.message, "", { cause: error })
        }
        throw new OAuthProtocolError("invalid_request", "Failed to fetch user information.", "", { cause: error })
    }
}
