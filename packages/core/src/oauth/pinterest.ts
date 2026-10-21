import { merge } from "@/shared/utils.ts"
import type { DeepPartial, LiteralUnion, OAuthProviderCredentials, User } from "@/@types/index.ts"

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
export const pinterest = <DefaultUser extends User = User>(
    options?: DeepPartial<OAuthProviderCredentials<PinterestProfile, DefaultUser>>
): OAuthProviderCredentials<PinterestProfile, DefaultUser> => {
    return merge(
        {
            id: "pinterest",
            name: "Pinterest",
            authorize: {
                url: "https://www.pinterest.com/oauth",
                params: {
                    scope: "user_accounts:read",
                    responseType: "code",
                },
            },
            authorizeURL: "https://www.pinterest.com/oauth",
            accessToken: "https://api.pinterest.com/v5/oauth/token",
            userInfo: "https://api.pinterest.com/v5/user_account",
            profile: (profile) =>
                ({
                    sub: profile.id,
                    name: profile.username,
                    image: profile.profile_image,
                    email: undefined,
                }) as DefaultUser,
        } satisfies OAuthProviderCredentials<PinterestProfile, DefaultUser>,
        options
    )
}
