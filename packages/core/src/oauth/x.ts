import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [X - Get my User](https://docs.x.com/x-api/users/get-my-user)
 */
export interface XProfile {
    data: {
        id: string
        name: string
        username: string
        profile_image_url: string
    }
}

/**
 * X (Twitter) OAuth Provider
 * @see [X - Developer Portal](https://developer.x.com/en/portal/projects-and-apps)
 * @see [X - Get my User](https://docs.x.com/x-api/users/get-my-user)
 * @see [X - OAuth 2.0 Authorization Code Flow with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
 * @see [X - OAuth 2.0 Scopes](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code#scopes)
 * @see [X - OAuth 2.0 Bearer Token](https://docs.x.com/fundamentals/authentication/oauth-2-0/application-only)
 */
export const x = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<XProfile, DefaultUser>>
): OAuthProviderCredentials<XProfile, DefaultUser> => {
    return {
        id: "x",
        name: "X",
        authorize: {
            url: "https://twitter.com/i/oauth2/authorize",
            params: {
                scope: "tweet.read users.read offline.access",
                response_type: "code",
            },
        },
        accessToken: "https://api.twitter.com/2/oauth2/token",
        userInfo: "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
        profile: (profile) =>
            ({
                sub: profile.data.id,
                name: profile.data.name,
                image: profile.data.profile_image_url,
                email: undefined,
            }) as DefaultUser,
        ...options,
    }
}
