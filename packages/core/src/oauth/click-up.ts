import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [Click Up - Get Authorized User](https://developer.clickup.com/reference/getauthorizeduser)
 */
export interface ClickUpProfile {
    user: {
        id: number
        username: string
        email: string
        color: string
        profilePicture: string
        initials: string
        week_start_day: number
        global_font_support: boolean
        timezone: string
    }
}

/**
 * ClickUp OAuth Provider
 *
 * @see [Click Up - Create your own app](https://help.clickup.com/hc/en-us/articles/6303422883095-Create-your-own-app-with-the-ClickUp-API)
 * @see [Click Up - Authentication](https://developer.clickup.com/docs/authentication)
 * @see [Click UP - Get Access Token](https://developer.clickup.com/reference/getaccesstoken)
 * @see [Click Up - Get Authorized User](https://developer.clickup.com/reference/getauthorizeduser)
 */
export const clickUp = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<ClickUpProfile, DefaultUser>>
): OAuthProviderCredentials<ClickUpProfile, DefaultUser> => {
    return {
        id: "click-up",
        name: "ClickUp",
        authorize: "https://app.clickup.com/api",
        accessToken: "https://api.clickup.com/api/v2/oauth/token",
        userInfo: "https://api.clickup.com/api/v2/user",
        profile: (profile) => {
            return {
                sub: String(profile.user.id),
                name: profile.user.username,
                email: profile.user.email,
                image: profile.user.profilePicture,
            } as DefaultUser
        },
        ...options,
    }
}
