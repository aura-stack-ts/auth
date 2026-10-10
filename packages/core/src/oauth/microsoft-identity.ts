import type { OpenIDProvider, User } from "@/@types/index.ts"

/**
 * @see [Microsoft Identity Platform - UserInfo Endpoint](https://learn.microsoft.com/en-us/entra/identity-platform/userinfo)
 * @see [Microsoft Identity Platform - ID Token Claims Reference](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference)
 */
export interface MicrosoftIdentityProfile {
    aud: string
    iss: string
    iat: number
    idp: string
    nbf: number
    exp: number
    c_hash: string
    at_hash: string
    preferred_username: string
    email: string
    nonce: string
    oid: string
    roles: string[]
    rh: string
    sub: string
    sid: string
    unique_name: string
    uti: string
    ver: string
    hasgroups: boolean
    name: string
    family_name: string
    given_name: string
    picture: string
}

export const MICROSOFT_IDENTITY_ISSUER = "https://login.microsoftonline.com/:tenantId/v2.0"

/**
 * Microsoft Identity Platform OpenID Connect Provider
 *
 * @see [Microsoft Identity Platform - OpenID Connect](https://learn.microsoft.com/en-us/entra/identity-platform/v2-protocols-oidc)
 * @see [Microsoft Identity Platform - OpenID Connect Metadata Document](https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration)
 * @see [Microsoft Identity Platform - OpenID Connect ID Token Claims](https://learn.microsoft.com/en-us/entra/identity-platform/id-tokens)
 * @see [Microsoft Identity Platform - OpenID Connect Scopes](https://learn.microsoft.com/en-us/entra/identity-platform/scopes-oidc)
 * @see [Microsoft Identity Platform - UserInfo Endpoint](https://learn.microsoft.com/en-us/entra/identity-platform/userinfo)
 * @see [Microsoft Identity Platform - ID Token Claims Reference](https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference)
 */
export const microsoftIdentity = <DefaultUser extends User = User>(
    options?: Partial<OpenIDProvider<MicrosoftIdentityProfile, DefaultUser, typeof MICROSOFT_IDENTITY_ISSUER>>
): OpenIDProvider<MicrosoftIdentityProfile, DefaultUser, typeof MICROSOFT_IDENTITY_ISSUER> => {
    return {
        id: "microsoft-identity",
        name: "Microsoft Identity",
        issuer: MICROSOFT_IDENTITY_ISSUER,
        profile: (profile) =>
            ({
                sub: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }) as DefaultUser,
        ...options,
    } as OpenIDProvider<MicrosoftIdentityProfile, DefaultUser, typeof MICROSOFT_IDENTITY_ISSUER>
}
