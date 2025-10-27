import { OAuthSecureConfig, OAuthUserProfile } from "@/@types/index.js"
import { AuraStackError } from "@/error.js"
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
        const valid = OAuthErrorResponse.safeParse(json)
        if (valid.success) {
            return Response.json(valid.data, { status: 400 })
        }
        return oauthConfig?.profile ? oauthConfig.profile(json) : getDefaultUserInfo(json)
    } catch {
        throw new AuraStackError(`Failed to retrieve userinfo from ${userinfoEndpoint}`)
    }
}
