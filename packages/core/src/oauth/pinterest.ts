import { LiteralUnion, OAuthProviderConfig } from "@/@types/index.js"

/**
 * @see [Pinterest - Get User Account](https://developers.pinterest.com/docs/api/v5/user_account-get)
 */
export interface PinterestProfile {
    account_type: LiteralUnion<"PINNER">
    id: string
    profile_image: string
    website_url: string
    username: string
    about: string
    business_name: string
    board_count: number
    pin_count: number
    follower_count: number
    following_count: number
    monthly_views: number
}

/**
 * @see [Pinterest - Connect App](https://developers.pinterest.com/docs/getting-started/connect-app/)
 * @see [Pinterest - My Apps](https://developers.pinterest.com/apps/)
 * @see [Pinterest - Get User Account](https://developers.pinterest.com/docs/api/v5/user_account-get)
 */
export const pinterest: OAuthProviderConfig<PinterestProfile> = {
    id: "pinterest",
    name: "Pinterest",
    authorizeURL: "https://api.pinterest.com/oauth/",
    accessToken: "https://api.pinterest.com/v5/oauth/token",
    userInfo: "https://api.pinterest.com/v5/user_account",
    scope: "user_accounts:read",
    responseType: "code",
    profile(profile) {
        return {
            sub: profile.id,
            name: profile.username,
            email: null,
            image: profile.profile_image,
        }
    },
}
