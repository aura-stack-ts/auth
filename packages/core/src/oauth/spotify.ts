import type { OAuthConfig } from "@/@types/index.js"

interface Image {
    url: string
    height: number
    width: number
}

/**
 * @see [Spotify - User Object](https://developer.spotify.com/documentation/web-api/reference/object-model/#user-object-private)
 */
export interface SpotifyProfile {
    id: string
    display_name: string
    email: string
    type: string
    uri: string
    country: string
    href: string
    images: Image[]
    product: string
    explicit_content: {
        filter_enabled: boolean
        filter_locked: boolean
    }
    external_urls: { spotify: string }
    followers: { href: string; total: number }
}

/**
 * @see [Spotify - Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
 * @see [Spotify - Get Current User's Profile](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile)
 * @see [Spotify - Getting started with Web API](https://developer.spotify.com/documentation/web-api/tutorials/getting-started)
 * @see [Spotify - Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)
 * @see [Spotify - Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes)
 */
export const spotify: OAuthConfig<SpotifyProfile> = {
    id: "spotify",
    name: "Spotify",
    authorizeURL: "https://accounts.spotify.com/authorize",
    accessToken: "https://accounts.spotify.com/api/token",
    userInfo: "https://api.spotify.com/v1/me",
    scope: "user-read-email user-read-private",
    responseType: "token",
    profile(profile) {
        return {
            sub: profile.id,
            name: profile.display_name,
            email: profile.email,
            image: profile.images?.[0]?.url,
        }
    },
}
