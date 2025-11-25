import { generateSecure } from "@/secure.js"
import { OAuthErrorResponse } from "@/schemas.js"
import { AuthError, throwAuthError } from "@/error.js"
import { OAuthSecureConfig, OAuthUserProfile } from "@/@types/index.js"

/**
 * Map the default user information fields from the OAuth integration's userinfo response
 *
 * @param profile - Raw profile object returned by the userinfo endpoint
 * @returns The standardized OAuth user profile
 */
const getDefaultUserInfo = (profile: Record<string, any>): OAuthUserProfile => {
    const sub = generateSecure(16)

    return {
        sub: profile?.id ?? profile?.sub ?? sub,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.image ?? profile?.picture,
    }
}

/**
 * Get user information from the OAuth integration's userinfo endpoint using the provided access token.
 * The response by default is mapped to the standardized `OAuthUserProfile` format unless a custom
 * `profile` function is provided in the `oauthConfig`.
 *
 * @param oauthConfig - OAuth integration configuration
 * @param accessToken - Access Token to access the userinfo endpoint
 * @returns The user information retrieved from the userinfo endpoint
 */
export const getUserInfo = async (oauthConfig: OAuthSecureConfig, accessToken: string) => {
    const userinfoEndpoint = oauthConfig.userInfo
    try {
        const response = await fetch(userinfoEndpoint, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        })
        const json = await response.json()
        const { success, data } = OAuthErrorResponse.safeParse(json)
        if (success) {
            throw new AuthError(data.error, data?.error_description ?? "An error occurred while fetching user information.")
        }
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch (error) {
        throw throwAuthError(error, "Failed to retrieve userinfo")
    }
}
