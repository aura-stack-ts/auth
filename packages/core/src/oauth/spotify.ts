import type { OAuthProviderCredentials } from "@/@types/index.js"

export interface SpotifyImage {
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
    images: SpotifyImage[]
    product: string
    explicit_content: {
        filter_enabled: boolean
        filter_locked: boolean
    }
    external_urls: { spotify: string }
    followers: { href: string; total: number }
}

/**
 * Spotify OAuth Provider
 *
 * @see [Spotify - Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
 * @see [Spotify - Getting started with Web API](https://developer.spotify.com/documentation/web-api/tutorials/getting-started)
 * @see [Spotify - Get Current User's Profile](https://developer.spotify.com/documentation/web-api/reference/get-current-users-profile)
 * @see [Spotify - Scopes](https://developer.spotify.com/documentation/web-api/concepts/scopes)
 * @see [Spotify - Redirect URIs](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri)
 */
export const spotify = (
    options?: Partial<OAuthProviderCredentials<SpotifyProfile>>
): OAuthProviderCredentials<SpotifyProfile> => {
    return {
        id: "spotify",
        name: "Spotify",
        authorizeURL: "https://accounts.spotify.com/authorize",
        accessToken: "https://accounts.spotify.com/api/token",
        userInfo: "https://api.spotify.com/v1/me",
        scope: "user-read-private user-read-email",
        responseType: "code",
        profile(profile) {
            return {
                sub: profile.id,
                name: profile.display_name,
                email: profile.email,
                image: profile.images[0]?.url ?? null,
            }
        },
        ...options,
    } as OAuthProviderCredentials<SpotifyProfile>
}
