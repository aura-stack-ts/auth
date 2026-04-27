import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [Dribble - User](https://developer.dribbble.com/v2/user/)
 */
export interface DribbbleDefault {
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

export interface DribbbleTeams extends DribbbleDefault {
    type: "Team"
    updated_at: string
}

export interface DribbbleProfile extends DribbbleDefault {
    type: "User"
    /** Not documented but available in the API response */
    email: string | null
    can_upload_shot: boolean
    pro: boolean
    followers_count: number
    teams: DribbbleTeams[]
}

/**
 * Dribbble OAuth provider
 *
 * @see [Dribbble - Register Application](https://dribbble.com/account/applications/new)
 * @see [Dribbble - OAuth](https://developer.dribbble.com/v2/oauth/)
 * @see [Dribbble - User](https://developer.dribbble.com/v2/user/)
 */
export const dribbble = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<DribbbleProfile, DefaultUser>>
): OAuthProviderCredentials<DribbbleProfile, DefaultUser> => {
    return {
        id: "dribbble",
        name: "Dribbble",
        authorize: {
            url: "https://dribbble.com/oauth/authorize",
            params: {
                scope: "public",
            },
        },
        accessToken: "https://dribbble.com/oauth/token",
        userInfo: "https://api.dribbble.com/v2/user",
        profile: (profile) => {
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
