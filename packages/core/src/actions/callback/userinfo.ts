import { OAuthUserProfile } from "@/@types/index.js"

const getDefaultUserInfo = (profile: Record<string, any>): OAuthUserProfile => {
    return {
        id: profile?.id,
        email: profile?.email,
        name: profile?.name ?? profile?.username ?? profile?.nickname,
        image: profile?.picture,
    }
}

export const getUserInfo = async (userinfoEndpoint: string, accessToken: string) => {
    try {
        const response = await fetch(userinfoEndpoint, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${accessToken}`,
            },
        })
        /*
        if (!response.ok) {
            throw new Error("Failed to fetch userinfo")
        }
        */
        const data = await response.json()
        return getDefaultUserInfo(data)
    } catch {
        throw new Error(`Failed to retrieve userinfo from ${userinfoEndpoint}`)
    }
}
