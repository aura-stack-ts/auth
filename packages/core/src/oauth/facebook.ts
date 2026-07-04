import type { OAuthProviderCredentials, User } from "@/@types/index.js"

export interface FacebookProfile {
    id: string
    first_name: string
    last_name: string
    middle_name: string
    name: string
    name_format: string
    picture: unknown
    short_name: string
    about: string
    age_range: unknown
    birthday: string
    client_business_id: string
    education: string
    favorite_athletes: string[]
    favorite_teams: string[]
    gender: string
    hometown: {
        id: string
        description: string
        from: string | null
        name: string | null
        with: string
    }
}

/**
 * Facebook OAuth Provider
 *
 * @see [Facebook - Getting Started with Facebook Login](https://developers.facebook.com/docs/facebook-login/getting-started)
 * @see [Facebook - Configure Your OAuth Settings](https://developers.facebook.com/docs/facebook-login/security#redirect-uris)
 * @see [Facebook - Permissions Reference](https://developers.facebook.com/docs/permissions/reference)
 * @see [Facebook - Login Review](https://developers.facebook.com/docs/facebook-login/review/)
 * @see [Facebook - Manually Build a Login Flow](https://developers.facebook.com/docs/facebook-login/manually-build-a-login-flow)
 * @see [Facebook - App](https://developers.facebook.com/)
 * @see [Facebook - User](https://developers.facebook.com/docs/graph-api/reference/user)
 */
export const facebook = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<FacebookProfile, DefaultUser>>
): OAuthProviderCredentials<FacebookProfile, DefaultUser> => {
    return {
        id: "facebook",
        name: "Facebook",
        authorize: {
            url: "https://www.facebook.com/v24.0/dialog/oauth",
            params: {
                scope: "email public_profile",
                responseType: "code",
            },
        },
        accessToken: "https://graph.facebook.com/v24.0/oauth/access_token",
        userInfo: "https://graph.facebook.com/me?fields=id,name,email,picture",
        profile: (profile) =>
            ({
                sub: profile.id.toString(),
                name: profile.name,
                email: null,
                image: profile.picture,
            }) as DefaultUser,
        ...options,
    }
}
