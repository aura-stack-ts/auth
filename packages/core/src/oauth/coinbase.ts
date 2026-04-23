import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

export interface CoinbaseProfile {
    data: {
        id: string
        name: string
        username: string
        profile_bio: string | null
        profile_location: string | null
        profile_url: string
        avatar_url: string
        resource: string
        resource_path: string
    }
}

/**
 * Coinbase OAuth Provider
 *
 * @see [Coinbase - App OAuth2 Integration](https://docs.cdp.coinbase.com/coinbase-app/oauth2-integration/integrations)
 * @see [Coinbase - Scopes](https://docs.cdp.coinbase.com/coinbase-app/oauth2-integration/scopes)
 */
export const coinbase = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<CoinbaseProfile, DefaultUser>>
): OAuthProviderCredentials<CoinbaseProfile, DefaultUser> => {
    return {
        id: "coinbase",
        name: "Coinbase",
        authorize: {
            url: "https://login.coinbase.com/oauth2/auth",
            params: {
                scope: "wallet:user:read+wallet:user:email",
                responseType: "code",
            },
        },
        accessToken: "https://login.coinbase.com/oauth2/token",
        userInfo: "https://api.coinbase.com/v2/user",
        profile: (profile) => {
            console.log("Coinbase profile", profile)
            return {
                sub: String(profile.data.id),
                name: profile.data.name,
                image: profile.data.avatar_url,
                email: null,
            } as DefaultUser
        },
        ...options,
    }
}
