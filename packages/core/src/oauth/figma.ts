import type { OAuthProviderConfig } from "@/@types/index.js"

/**
 * @see [Figma API - Users](https://developers.figma.com/docs/rest-api/users-types/)
 */
export interface FigmaProfile {
    id: string
    handle: string
    img_url: string
    email: string
}

/**
 * Figma OAuth Provider
 * @see [Figma - REST API Introduction](https://developers.figma.com/docs/rest-api/)
 * @see [Figma - OAuth App](https://www.figma.com/developers/apps/)
 * @see [Figma - Create an OAuth App](https://developers.figma.com/docs/rest-api/authentication/#create-an-oauth-app)
 * @see [Figma - OAuth Scopes](https://developers.figma.com/docs/rest-api/scopes/)
 */
export const figma: OAuthProviderConfig<FigmaProfile> = {
    id: "figma",
    name: "Figma",
    authorizeURL: "https://www.figma.com/oauth",
    accessToken: "https://api.figma.com/v1/oauth/token",
    userInfo: "https://api.figma.com/v1/me",
    scope: "current_user:read",
    responseType: "code",
    profile(profile: FigmaProfile) {
        return {
            sub: profile.id,
            name: profile.handle,
            email: profile.email,
            image: profile.img_url,
        }
    },
}
