import type { User } from "@/@types/session.ts"
import type { DeviceProviderConfig } from "@/@types/device.ts"

/**
 * @see [Get the authenticated user](https://docs.github.com/en/rest/users/users?apiVersion=2022-11-28#get-the-authenticated-user)
 */
export interface GitHubProfile {
    login: string
    id: number
    user_view_type: string
    node_id: string
    avatar_url: string
    gravatar_id: string | null
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
    name: string | null
    company: string | null
    blog: string | null
    location: string | null
    email: string | null
    notification_email: string | null
    hireable: boolean | null
    bio: string | null
    twitter_username?: string | null
    public_repos: number
    public_gists: number
    followers: number
    following: number
    created_at: string
    updated_at: string
    private_gists?: number
    total_private_repos?: number
    owned_private_repos?: number
    disk_usage?: number
    collaborators?: number
    two_factor_authentication: boolean
    plan?: {
        collaborators: number
        name: string
        space: number
        private_repos: number
    }
}

export const github = <DefaultUser extends User = User>(
    options?: Partial<DeviceProviderConfig<GitHubProfile, DefaultUser>>
): DeviceProviderConfig<GitHubProfile, DefaultUser> => {
    return {
        id: "github",
        name: "GitHub",
        deviceAuthorization: {
            url: "https://github.com/login/device/code",
            params: {
                scope: "read:user user:email",
            },
        },
        accessToken: "https://github.com/login/oauth/access_token",
        userInfo: "https://api.github.com/user",
        profile: (profile) =>
            ({
                sub: profile.id.toString(),
                name: profile.name || profile.login,
                image: profile.avatar_url,
                email: profile.email,
            }) as DefaultUser,
        ...options,
    }
}
