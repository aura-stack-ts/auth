import type { OAuthProviderConfig, OAuthProviderCredentials, User } from "@/@types/index.js"

/**
 * @see [TikTok - User Object](https://developers.tiktok.com/doc/tiktok-api-v1-user-info)
 */
export interface TikTokProfile {
    open_id: string
    union_id: string
    avatar_url: string
    avatar_url_100: string
    avatar_large_url: string
    display_name: string
    description: string
    bio_description: string
    profile_deep_link: string
    is_verified: boolean
    username: string
    follower_count: number
    following_count: number
    likes_count: number
    video_count: number
}

/**
 * @see [TikTok - Manage Apps](https://developers.tiktok.com/apps)
 * @see [TikTok - Scopes](https://developers.tiktok.com/doc/tiktok-api-scopes)
 * @see [TikTok - User Object](https://developers.tiktok.com/doc/tiktok-api-v1-user-info)
 * @see [TikTok - App Review Guidelines](https://developers.tiktok.com/doc/app-review-guidelines)
 * @todo: add `client_key` search parameter in `authorize` endpoint.
 */
export const tiktok = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderConfig<TikTokProfile, DefaultUser>>
): OAuthProviderCredentials<TikTokProfile, DefaultUser> => {
    return {
        id: "tiktok",
        name: "TikTok",
        authorize: {
            url: "https://www.tiktok.com/v2/auth/authorize",
            params: {
                scope: "user.info.basic",
                response_type: "code",
            },
        },
        accessToken: "https://open.tiktokapis.com/v2/oauth/token",
        userInfo: "https://open.tiktokapis.com/v2/user/info",
        profile: (profile) =>
            ({
                sub: profile.open_id,
                name: profile.display_name,
                image: profile.avatar_url_100,
                email: "",
            }) as DefaultUser,
        ...options,
    }
}
