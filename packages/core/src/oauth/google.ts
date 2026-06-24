import type { OpenIDProvider, User } from "@/@types/index.ts"

/**
 * @see [Google - ID Token (Claims)](https://developers.google.com/identity/openid-connect/reference#id_token_claims)
 */
export interface GoogleProfile {
    /**
     * The issuer identifier for the issuer of the response.
     * Typically `https://accounts.google.com` or `accounts.google.com`
     */
    iss: string
    /**
     * The subject identifier for the user. This is a unique and immutable
     * identifier for the user.
     */
    sub: string
    /**
     * The audience for which the ID token is intended.
     */
    aud: string
    /**
     * The time of the ID token was issued.
     */
    iat: string
    /**
     * Expiration time on or after which the ID token must not be accepted.
     */
    exp: string
    /**
     * The client Identifier for the authorized presenter, obtained from
     * the Goole Cloud Console.
     */
    azp?: string
    /**
     * The value of the `nonce` supplied by the client.
     */
    nonce?: string
    /**
     * The time user authentication took placea JSON number representing
     * the number of seconds.
     */
    auth_time?: number
    /**
     * Access token hash. Provides validation that the Access TOken is tied
     * to the identity token.
     */
    at_hash?: string
    /**
     * The domain associated with the Google Workspace or Cloud organization of the user.
     */
    hd?: string
    /**
     * The user's email address.
     * > Note: Provided only if you included the `email` scope in your request.
     *
     * > Warning: Don't use email address as an identifier because a Google
     * Account can have multiple email addresses at different points in time.
     * Always use the `sub` field as the identifier for the user.
     */
    email: string
    /**
     * `True` if the user's email address has been verified.
     */
    email_verified?: boolean
    /**
     * The user's full name.
     * > Note: Provided only if you included the `profile` scope in your request.
     */
    name: string
    /**
     * The URL of the user's profile picture.
     * > Note: Provided only if you included the `profile` scope in your request.
     */
    picture: string
    /**
     * The user's give name(s) or first name(s).
     */
    given_name?: string
    /**
     * The user's family name(s) or last name(s).
     */
    family_name?: string
}

/**
 * Google OpenID Connect Provider
 *
 * @see [Google - Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/oauth2)
 * @see [Google - OpenID Connect](https://developers.google.com/identity/openid-connect/openid-connect)
 * @see [Google - OpenID Connect API Reference](https://developers.google.com/identity/openid-connect/reference)
 * @see [Google - Client Credentials](https://console.cloud.google.com/auth/clients)
 */
export const google = <DefaultUser extends User = User>(
    options?: Partial<OpenIDProvider<GoogleProfile, DefaultUser>>
): OpenIDProvider<GoogleProfile, DefaultUser> => {
    return {
        id: "google",
        name: "Google",
        issuer: "https://accounts.google.com",
        profile: (profile) =>
            ({
                sub: profile.sub,
                name: profile.name,
                email: profile.email,
                image: profile.picture,
            }) as DefaultUser,
        ...options,
    }
}
