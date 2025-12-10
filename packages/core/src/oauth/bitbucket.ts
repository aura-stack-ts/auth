import type { LiteralUnion, OAuthConfig } from "@/@types/index.js"

/**
 * @see [Get current user](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/#api-user-get)
 */
export interface BitbucketProfile {
    display_name: string
    links: Record<LiteralUnion<"self" | "avatar" | "repositories" | "snippets" | "html" | "hooks">, { href?: string }>
    created_on: string
    type: string
    uuid: string
    has_2fa_enabled: boolean
    username: string
    nickname: string
    is_staff: boolean
    account_id: string
    account_status: LiteralUnion<"active" | "inactive" | "closed">
    location: string | null
}

/**
 * Bitbucket OAuth Provider
 *
 * @see [Bitbucket - Official App](https://bitbucket.org/)
 * @see [Bitbucket - Workspaces](https://bitbucket.org/account/workspaces/)
 * @see [Bitbucket - Workspace Settings](https://bitbucket.org/{workspace-name}/workspace/settings/)
 * @see [Bitbucket - OAuth 2.0](https://developer.atlassian.com/cloud/bitbucket/oauth-2/)
 * @see [Bitbucket - Use OAuth on Bitbucket Cloud](https://support.atlassian.com/bitbucket-cloud/docs/use-oauth-on-bitbucket-cloud/)
 * @see [Bitbucket - Cloud REST API](https://developer.atlassian.com/cloud/bitbucket/rest/intro/)
 * @see [Bitbucket - User Endpoint](https://developer.atlassian.com/cloud/bitbucket/rest/api-group-users/#api-users-endpoint)
 */
export const bitbucket: OAuthConfig<BitbucketProfile> = {
    id: "bitbucket",
    name: "Bitbucket",
    authorizeURL: "https://bitbucket.org/site/oauth2/authorize",
    accessToken: "https://bitbucket.org/site/oauth2/access_token",
    userInfo: "https://api.bitbucket.org/2.0/user",
    scope: "account email",
    responseType: "code",
    profile(profile) {
        return {
            sub: profile.uuid ?? profile.account_id,
            name: profile.display_name ?? profile.nickname,
            image: profile.links.avatar.href,
        }
    },
}
