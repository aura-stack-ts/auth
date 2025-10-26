import type { OAuthConfig } from "@/@types/index.js"

export const github: OAuthConfig = {
    id: "github",
    name: "GitHub",
    authorizeURL: "https://github.com/login/oauth/authorize",
    accessToken: "https://github.com/login/oauth/access_token",
    userInfo: "https://api.github.com/user",
    scope: "read:user user:email",
    responseType: "code",
}
