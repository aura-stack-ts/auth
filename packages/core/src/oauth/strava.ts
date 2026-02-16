import type { OAuthProviderCredentials } from "@/@types/index.js"

/**
 * @see [Strava - SummaryClub](https://developers.strava.com/docs/reference/#api-models-SummaryClub)
 */
export interface SummaryClub {
    id: number
    resource_state: number
    name: string
    profile_medium: string
    cover_photo: string
    cover_photo_small: string
    sport_type: "cycling" | "running" | "triathlon" | "other"
    activity_types: string[]
    city: string
    state: string
    country: string
    private: boolean
    member_count: number
    featured: boolean
    verified: boolean
    url: string
}

/**
 * @see [Strava - SummaryGear](https://developers.strava.com/docs/reference/#api-models-SummaryGear)
 */
export interface SummaryGear {
    id: string
    resource_state: number
    primary: boolean
    name: string
    distance: number
}

/**
 * @see [Strava - DetailedAthlete](https://developers.strava.com/docs/reference/#api-models-DetailedAthlete)
 */
export interface StravaProfile {
    id: number
    resource_state: number
    firstname: string
    lastname: string
    bio: string | null
    profile: string
    profile_medium: string
    city: string
    state: string
    country: string
    sex: string
    premium: boolean
    summit: boolean
    created_at: Date
    updated_at: Date
    badge_type_id: number
    weight: number
    friend: null
    follower: null
    follower_count: number
    friend_count: number
    measurement_preference: string
    ftp: number
    clubs: SummaryClub[]
    bikes: SummaryGear[]
    shoes: SummaryGear[]
}

/**
 * Strava OAuth Provider
 * @see [Strava - Getting Started with the Strava API](https://developers.strava.com/docs/getting-started/)
 * @see [Strava - My Applications](https://www.strava.com/settings/api)
 * @see [Strava - Authentication](https://developers.strava.com/docs/authentication/)
 * @see [Strava - API Application](https://www.strava.com/settings/api)
 * @see [Strava - API Reference](https://developers.strava.com/docs/reference/)
 */
export const strava = (options?: Partial<OAuthProviderCredentials<StravaProfile>>): OAuthProviderCredentials<StravaProfile> => {
    return {
        id: "strava",
        name: "Strava",
        authorizeURL: "https://www.strava.com/oauth/authorize",
        accessToken: "https://www.strava.com/oauth/token",
        userInfo: "https://www.strava.com/api/v3/athlete",
        scope: "read",
        responseType: "code",
        profile(profile) {
            return {
                sub: profile.id.toString(),
                name: `${profile.firstname} ${profile.lastname}`,
                image: profile.profile,
                email: undefined,
            }
        },
        ...options,
    } as OAuthProviderCredentials<StravaProfile>
}
