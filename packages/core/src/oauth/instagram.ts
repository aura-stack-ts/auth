import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [Instagram - Me Fields](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started#fields)
 */
export interface InstagramProfile {
    id: string
    user_id: string
    username: string
    name?: string
    account_type?: string
    profile_picture_url?: string
    followers_count?: number
    follows_count?: number
    media_count?: number
}

/**
 * Instagram OAuth Provider
 *
 * @see [Instagram - Create an App](https://developers.facebook.com/documentation/development/create-an-app)
 * @see [Instagram - OAuth authorize](https://developers.facebook.com/documentation/instagram-platform/reference/oauth-authorize)
 * @see [Instagram - OAuth Access Token](https://developers.facebook.com/documentation/instagram-platform/reference/access_token)
 * @see [Instagram - Refresh Access Token](https://developers.facebook.com/documentation/instagram-platform/reference/refresh_access_token)
 * @see [Instagram - Me Fields](https://developers.facebook.com/documentation/instagram-platform/instagram-api-with-instagram-login/get-started#fields)
 */
export const instagram = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<InstagramProfile, DefaultUser>>
): OAuthProviderCredentials<InstagramProfile, DefaultUser> => {
    return {
        id: "instagram",
        name: "Instagram",
        authorize: {
            url: "https://api.instagram.com/oauth/authorize",
            params: {
                scope: "instagram_business_basic",
            },
        },
        accessToken: "https://api.instagram.com/oauth/access_token",
        userInfo: "https://graph.instagram.com/v25.0/me?fields=id,username,email,profile_picture_url",
        profile: (profile) =>
            ({
                sub: profile.id.toString(),
                name: profile.username,
                email: null,
                image: profile.profile_picture_url,
            }) as DefaultUser,
        ...options,
    }
}
