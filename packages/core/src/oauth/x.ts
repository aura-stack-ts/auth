import type { OAuthConfig } from "@/@types/index.js"

export const x: OAuthConfig = {
    id: "x",
    name: "X",
    authorizeURL: "https://x.com/i/oauth2/authorize",
    accessToken: "https://api.x.com/2/oauth2/token",
    userInfo: "https://api.x.com/2/users/me?user.fields=profile_image_url",
    scope: "users.read tweet.read offline.access",
    responseType: "code",
}
