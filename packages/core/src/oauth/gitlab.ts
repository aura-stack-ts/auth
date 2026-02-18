import type { OAuthProviderCredentials } from "@/@types/index.js"

/**
 * @see [GitLab - User Structure](https://docs.gitlab.com/ee/api/users.html#external-user-structure)
 */
export interface GitLabProfile {
    id: number
    username: string
    email: string
    name: string
    state: string
    locked: boolean
    avatar_url: string
    web_url: string
    created_at: string
    bio: string
    location: string | null
    public_email: string
    linkedin: string
    twitter: string
    discord: string
    github: string
    website_url: string
    organization: string
    job_title: string
    pronouns: string
    bot: boolean
    work_information: string | null
    followers: number
    following: number
    local_time: string
    last_sign_in_at: string
    confirmed_at: string
    theme_id: number
    last_activity_on: string
    color_scheme_id: number
    projects_limit: number
    current_sign_in_at: string
    identities: {
        provider: string
        extern_uid: string
        saml_provider_id: number | null
    }[]
    can_create_group: boolean
    can_create_project: boolean
    two_factor_enabled: boolean
    external: boolean
    private_profile: boolean
    commit_email: string
    preferred_language: string
    shared_runners_minutes_limit: number | null
    extra_shared_runners_minutes_limit: number | null
    scim_identities: unknown[]
}

/**
 * GitLab OAuth Provider
 *
 * @see [GitLab - Applications](https://gitlab.com/-/user_settings/applications)
 * @see [GitLab - OAuth 2.0 identify provider API](https://docs.gitlab.com/api/oauth2/)
 * @see [GitLab - Scopes](https://docs.gitlab.com/integration/oauth_provider/#view-all-authorized-applications)
 * @see [GitLab - Get current user](https://docs.gitlab.com/api/users/#get-the-current-user)
 */
export const gitlab = (options?: Partial<OAuthProviderCredentials<GitLabProfile>>): OAuthProviderCredentials<GitLabProfile> => {
    return {
        id: "gitlab",
        name: "GitLab",
        authorizeURL: "https://gitlab.com/oauth/authorize",
        accessToken: "https://gitlab.com/oauth/token",
        userInfo: "https://gitlab.com/api/v4/user",
        scope: "read_user",
        responseType: "code",
        profile(profile) {
            return {
                sub: profile.id.toString(),
                name: profile.name ?? profile.username,
                email: profile.email,
                image: profile.avatar_url,
            }
        },
        ...options,
    } as OAuthProviderCredentials<GitLabProfile>
}
