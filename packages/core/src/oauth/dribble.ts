import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [Dribble - User](https://developer.dribbble.com/v2/user/)
 */
export interface DribbleDefault {
    id: number
    name: string
    login: string
    html_url: string
    avatar_url: string
    bio: string
    location: string
    links?: {
        web?: string
        twitter?: string
    }
    created_at: string
}

export interface DribbleTeams extends DribbleDefault {
    type: "Team"
    updated_at: string
}

export interface DribbleProfile extends DribbleDefault {
    type: "User"
    /** Not documented but available in the API response */
    email: string | null
    can_upload_shot: boolean
    pro: boolean
    followers_count: number
    teams: DribbleTeams[]
}

/**
 * Dribble OAuth provider
 *
 * @see [Dribble - Register Application](https://dribbble.com/account/applications/new)
 * @see [Dribble - OAuth](https://developer.dribbble.com/v2/oauth/)
 * @see [Dribble - User](https://developer.dribbble.com/v2/user/)
 */
export const dribble = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<DribbleProfile, DefaultUser>>
): OAuthProviderCredentials<DribbleProfile, DefaultUser> => {
    return {
        id: "dribble",
        name: "Dribble",
        authorize: {
            url: "https://dribbble.com/oauth/authorize",
            params: {
                scope: "public",
            },
        },
        accessToken: "https://dribbble.com/oauth/token",
        userInfo: "https://api.dribbble.com/v2/user",
        profile: (profile) => {
            console.log("Dribble profile", profile)
            return {
                sub: String(profile.id),
                name: profile.name,
                image: profile.avatar_url,
                email: profile.email,
            } as DefaultUser
        },
        ...options,
    }
}
