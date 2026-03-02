import { getEnv } from "@/env.ts"
import type { OAuthProviderCredentials } from "@/@types/index.ts"

/**
 * @see [Twitch - Get Users](https://dev.twitch.tv/docs/api/reference#get-users)
 */
export interface TwitchProfile {
    id: string
    login: string
    display_name: string
    type: string
    broadcaster_type: string
    description: string
    profile_image_url: string
    offline_image_url: string
    view_count: number
    email?: string
    created_at: string
}

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
        authorize: {
            url: "https://id.twitch.tv/oauth2/authorize",
            params: { scope: "user:read:email", response_type: "code" },
        },
        accessToken: "https://id.twitch.tv/oauth2/token",
        userInfo: {
            url: "https://api.twitch.tv/helix/users",
            headers: {
                "Client-ID": getEnv("TWITCH_CLIENT_ID"),
            },
        },
        profile(profile: { data: TwitchProfile[] }) {
            console.log("Twitch profile data:", profile)
            const user = profile.data[0]
            if (!user) {
                throw new Error("No user data found in Twitch profile response")
            }
            return {
                sub: user.id,
                name: user.display_name,
                email: user.email,
                picture: user.profile_image_url,
            }
        },
        ...options,
    } as OAuthProviderCredentials<TwitchProfile>
}
