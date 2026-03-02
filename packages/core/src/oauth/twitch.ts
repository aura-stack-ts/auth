import { getEnv } from "@/env.ts"
import type { OAuthProviderCredentials } from "@/@types/index.ts"

/**
 * @see [Twitch - Get Users](https://dev.twitch.tv/docs/api/reference#get-users)
 */
export interface TwitchProfile {}

/**
 * @see [Twitch - Get Started with the Twitch API](https://dev.twitch.tv/docs/api/get-started/)
 * @see [Twitch - Authorization code grant flow](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow)
 * @see [Twitch - Register Your App](https://dev.twitch.tv/docs/authentication/register-app)
 * @see [Twitch - Setting up Two-Factor Authentication (2FA)](https://help.twitch.tv/s/article/two-factor-authentication?language=en_US)
 * @see [Twitch - Security and Privacy](https://www.twitch.tv/settings/security)
 * @see [Twitch - Get Users](https://dev.twitch.tv/docs/api/reference#get-users)
 * @see [Twitch - Scopes](https://dev.twitch.tv/docs/authentication/scopes/)
 */
export const twitch = (options?: Partial<OAuthProviderCredentials<TwitchProfile>>): OAuthProviderCredentials<TwitchProfile> => {
    return {
        id: "twitch",
        name: "Twitch",
        authorize: "https://id.twitch.tv/oauth2/authorize",
        authorizeURL: "https://id.twitch.tv/oauth2/authorize",
        accessToken: "https://id.twitch.tv/oauth2/token",
        userInfo: {
            url: "https://api.twitch.tv/helix/users",
            headers: {
                "Client-ID": getEnv("TWITCH_CLIENT_ID")
            }
        },
        scope: "user:read:email",
        responseType: "code",
        profile(profile) {
            console.log("Twitch profile data:", profile)
            return {
                sub: "",
            }
        },
        ...options,
    } as OAuthProviderCredentials<TwitchProfile>
}
