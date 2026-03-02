import type { LiteralUnion, OAuthProviderCredentials } from "@/@types/index.js"

export interface ExtendedProfile {
    job_title: string
    organization: string
    department: string
    location: string
}

export interface AtlassianProfile {
    account_id: string
    account_type: string
    account_status: LiteralUnion<"active">
    email: string
    email_verified: boolean
    name: string
    picture: string
    nickname: string
    zoneinfo: string
    locale: string
    extended_profile: ExtendedProfile
    last_updated: string
    created_at: string
}

/**
 * @see [Atlassian - OAuth Apps](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
 * @see [Atlassian - My Apps](https://developer.atlassian.com/console/myapps/)
 * @see [Atlassian - Retrieve Authenticated User](https://developer.atlassian.com/cloud/jira/software/oauth-2-3lo-apps/#how-do-i-retrieve-the-public-profile-of-the-authenticated-user-)
 */
export const atlassian = (
    options?: Partial<OAuthProviderCredentials<AtlassianProfile>>
): OAuthProviderCredentials<AtlassianProfile> => {
    return {
        id: "atlassian",
        name: "Atlassian",
        authorize: {
            url: "https://auth.atlassian.com/authorize",
            params: {
                audience: "api.atlassian.com",
                scope: "read:me read:account",
                prompt: "consent",
            },
        },
        authorizeURL: "https://auth.atlassian.com/authorize",
        accessToken: "https://auth.atlassian.com/oauth/token",
        userInfo: "https://api.atlassian.com/me",
        scope: "read:me read:account",
        responseType: "code",
        profile(profile) {
            return {
                sub: profile.account_id,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }
        },
        ...options,
    } as OAuthProviderCredentials<AtlassianProfile>
}
