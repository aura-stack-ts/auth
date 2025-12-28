import { OAuthProviderConfig } from "@/@types/index.js";

export interface TwitchProfile {


}

/**
 * @see [Twitch - Get Started with the Twitch API](https://dev.twitch.tv/docs/api/get-started/)
 * @see [Twitch - Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
 * @see [Twitch - Register Your App](https://dev.twitch.tv/docs/authentication/register-app)
 * @see [Twitch - ]
 * @see [Twitch - ]
 * @see [Twitch - ]
 */
export const twitch: OAuthProviderConfig<TwitchProfile> = {
    id: "twitch",
    name: "Twitch",
    authorizeURL: "https://id.twitch.tv/oauth2/authorize",
    accessToken: "https://id.twitch.tv/oauth2/token",
    userInfo: "https://api.twitch.tv/helix/users",
    scope: "user:read:email",
    responseType: "code",
    profile() {
        return {
            sub: ""
        }
    }
}