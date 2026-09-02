import type { OAuthProviderCredentials, User } from "@/@types/index.ts"

/**
 * @see [Azure Active Directory B2C - Claims](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview#claims)
 */
export interface AzureADB2CProfile {
    aud: string
    iss: string
    iat: number
    exp: number
    nbf: number
    ver: string
    c_hash: string
    at_hash: string
    nonce: string
    sub: string
    acr: string
    auth_time: number
    scp: string
    azp: string
    email: string
    email_verified: boolean
    name: string
    given_name: string
    family_name: string
    preferred_username: string
    nickname: string
}

/**
 * Azure ActiveDirectory B2C OpenID Connect Provider
 *
 * > Should set the tenant and policy values in the authorize URL and access token URL.:
 * > - https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize
 * > - https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/token
 *
 * @todo Investigate what does https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_sign_in/v2.0/.well-known/openid-configuration URL
 *
 * @see [Azure Active Directory B2C - OAuth 2.0 Provider](https://learn.microsoft.com/en-us/azure/active-directory-b2c/)
 * @see [Azure Active Directory B2C - Authorization Code Flow](https://learn.microsoft.com/en-us/azure/active-directory-b2c/authorization-code-flow)
 * @see [Azure Active Directory B2C - Register a web application](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tutorial-register-applications)
 * @see [Azure Active Directory B2C - Request an access token](https://learn.microsoft.com/en-us/azure/active-directory-b2c/access-tokens)
 * @see [Azure Active Directory B2C - Claims](https://learn.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview#claims)
 */
export const azureADB2C = <DefaultUser extends User = User>(
    options?: Partial<OAuthProviderCredentials<AzureADB2CProfile, DefaultUser>>
): OAuthProviderCredentials<AzureADB2CProfile, DefaultUser> => {
    return {
        id: "azure-ad-b2c",
        name: "Azure AD B2C",
        authorize: {
            url: "https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/authorize",
            params: { scope: "profile email" },
        },
        accessToken: "https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/oauth2/v2.0/token",
        userInfo: "https://{tenant}.b2clogin.com/{tenant}.onmicrosoft.com/{policy}/openid-configuration",
        profile: (profile) =>
            ({
                sub: profile.sub,
                name: profile.name,
                email: profile.email,
                image: null,
            }) as DefaultUser,
        ...options,
    }
}
