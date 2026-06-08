import type { OAuthProviderConfig, User } from "@/@types/index.ts"

export interface HubSportSignedAccessToken {
    appId: number
    appInstallId: number
    audience: string
    expiresAt: string
    hubId: number
    hublet: string
    installingUserId: number
    isPrivateDistribution: boolean
    isServiceAccount: boolean
    isUserLevel: boolean
    newSignature: string
    scopeToScopeGroupPks: string
    scopes: string
    signature: string
    trialScopeToScopeGroupPks: string
    trialScopes: string
    userId: number
}

/**
 * @see [HubSpot - Retrieve OAuth token metadata](https://developers.hubspot.com/docs/api-reference/legacy/authentication/oauth-tokens/v1/get-oauth-token-metadata)
 */
export interface HubSpotProfile {
    /**
     * The ID of the application associated with the access token.
     */
    app_id: number
    /**
     * The time in seconds until the access token expires.
     */
    expires_in: number
    /**
     * The ID of the HubSpot account associated with the access token.
     */
    hub_id: number
    /**
     * An array of strings indicating the scopes
     */
    scopes: string[]
    /**
     * The access token string used to make API calls.
     */
    token: string
    /**
     * The type of token, typically indicating the authentication scheme.
     * @default `bearer`
     */
    token_type: string
    /**
     * The ID of the hubspot user for whom the access token was created.
     */
    user_id: number
    /**
     * The domain of the HubSpot account associated with the access token.
     */
    hub_domain: string
    /**
     * Indicates whether the token is for a privately distributed application. If false, it is marketplace distributed.
     */
    is_private_distribution: boolean

    signed_access_token: HubSportSignedAccessToken
    /**
     * The email address of the hubspot user for whom the access token was created.
     */
    user: string
}

/**
 * HubSpot OAuth provider
 * Profile Type {@link HubSpotProfile}
 *
 * @see [HubSpot - Working with OAuth](https://developers.hubspot.com/docs/apps/legacy-apps/authentication/oauth-quickstart-guide#getting-oauth-tokens)
 * @see [HubSpot - Scopes](https://developers.hubspot.com/docs/apps/legacy-apps/authentication/scopes)
 * @see [HubSpot - Retrieve OAuth token metadata](https://developers.hubspot.com/docs/api-reference/legacy/authentication/oauth-tokens/v1/get-oauth-token-metadata)
 */
export const hubspot = <DefaultUser extends User = User>(
    options?: OAuthProviderConfig<HubSpotProfile, DefaultUser>
): OAuthProviderConfig<HubSpotProfile, DefaultUser> => {
    return {
        id: "hubspot",
        name: "HubSpot",
        authorize: {
            url: "https://app.hubspot.com/oauth/authorize",
            params: {
                scope: "oauth",
            },
        },
        accessToken: "https://api.hubapi.com/oauth/v1/token",
        userInfo: {
            url: "https://api.hubapi.com/oauth/v1/access-tokens",
            request: async ({ accessToken }) => {
                const response = await fetch(`https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`)
                const json = await response.json()
                return json
            },
        },
        profile: (profile) => {
            return {
                sub: String(profile.user_id),
                name: profile.user,
                email: null,
                image: null,
            } as DefaultUser
        },
        ...options,
    }
}
