import { OAuthSecureConfig, OAuthUserProfile } from "@/@types/index.js"
import { AuraAuthError, throwAuraAuthError } from "@/error.js"
import { OAuthErrorResponse } from "@/schemas.js"

const getDefaultUserInfo = (profile: Record<string, any>): OAuthUserProfile => {
    return {
        id: profile?.id,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.image ?? profile?.picture,
    }
}

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
            throw new AuraAuthError(data.error, data?.error_description ?? "An error occurred while fetching user information.")
        }
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch (error) {
        throwAuraAuthError(error, "Failed to retrieve userinfo")
    }
}
