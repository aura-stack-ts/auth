import type { OAuthConfig } from "@/@types/index.js"

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
 * @see [X - Developer Portal](https://developer.x.com/en/portal/projects-and-apps)
 * @see [X - Get my User](https://docs.x.com/x-api/users/get-my-user)
 * @see [X - OAuth 2.0 Authorization Code Flow with PKCE](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code)
 * @see [X - OAuth 2.0 Scopes](https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code#scopes)
 * @see [X - OAuth 2.0 Bearer Token](https://docs.x.com/fundamentals/authentication/oauth-2-0/application-only)
 */
export const x: OAuthConfig<XProfile> = {
    id: "x",
    name: "X",
    authorizeURL: "https://x.com/i/oauth2/authorize",
    accessToken: "https://api.x.com/2/oauth2/token",
    userInfo: "https://api.x.com/2/users/me?user.fields=profile_image_url",
    scope: "users.read users.email tweet.read offline.access",
    responseType: "code",
    profile({ data }) {
        return {
            sub: data.id,
            name: data.name,
            image: data.profile_image_url,
            email: "",
        }
    },
}
