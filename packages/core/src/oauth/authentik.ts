import type { OpenIDProvider, User } from "@/@types/index.ts"

export interface AuthentikProfile {
  iss: string
  sub: string
  aud: string
  exp: number
  iat: number
  auth_time: number
  acr: string
  c_hash: string
  nonce: string
  at_hash: string
  email: string
  email_verified: boolean
  name: string
  given_name: string
  family_name: string
  preferred_username: string
  nickname: string
}

/**
 * Authentik OpenID Connect Provider
 *
 * @see [Authentik - OAuth 2.0 Provider](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/)
 * @see [Authentik - Create an OAuth2 Provider](https://docs.goauthentik.io/add-secure-apps/providers/oauth2/create-oauth2-provider/)
 */
export const authentik = <DefaultUser extends User = User>(
    options?: Partial<OpenIDProvider<AuthentikProfile, DefaultUser>>
): OpenIDProvider<AuthentikProfile, DefaultUser> => {
    return {
        id: "authentik",
        name: "Authentik",
        issuer: "https://authentik.company/application/o/:application_slug/.well-known/openid-configuration,",
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