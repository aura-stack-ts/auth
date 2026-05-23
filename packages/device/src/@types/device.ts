import type { User } from "@/@types/session.ts"

export type DeviceAuthorizationConfig = string | { url: string; params?: { scope?: string } }

export interface DeviceProviderConfig<Profile extends object = Record<string, any>, DefaultUser = User> {
    /**
     * Default OAuth scope when not specified on the device authorization endpoint params.
     */
    scope?: string
    /**
     * A unique identifier for the device provider, used for logging and debugging purposes.
     */
    id: string
    /**
     * A human-readable name for the device provider, which may be displayed to users during
     * the authentication process.
     */
    name: string
    /**
     * The configuration for the device authorization endpoint, which can be a URL string or
     * an object containing the URL and optional parameters such as scope.
     */
    deviceAuthorization: DeviceAuthorizationConfig
    /**
     * The configuration for the token endpoint, which can be a URL string or an object
     * containing the URL and optional parameters.
     */
    accessToken: string | { url: string }
    /**
     * The configuration for the user information endpoint, which can be a URL string or an object
     * containing the URL and optional parameters.
     */
    userInfo: string | { url: string }
    /**
     * An optional function that takes the user profile returned from the user information endpoint
     * and transforms it into a DefaultUser object. This allows for customization of the user data
     * structure based on the specific requirements of the application.
     */
    profile?: (profile: Profile) => DefaultUser | Promise<DefaultUser>
}

export interface DeviceProviderCredentials<
    Profile extends object = Record<string, any>,
    DefaultUser extends User = User,
> extends DeviceProviderConfig<Profile, DefaultUser> {
    clientId: string
}

/**
 * Device Authorization Response as per RFC 8628
 * @see https://datatracker.ietf.org/doc/html/rfc8628#section-3.2
 *
 * @example
 * {
 *   "device_code": "GmRhmhcxhwAzkoEqiMEg_DnyEysNkuNhszIySk9eS",
 *   "user_code": "WDJB-MJHT",
 *   "verification_uri": "https://example.com/device",
 *   "verification_uri_complete": "https://example.com/device?user_code=WDJB-MJHT",
 *   "expires_in": 1800,
 *   "interval": 5
 * }
 */
export interface DeviceAuthorizationResponse {
    /**
     * The device verification code.
     */
    deviceCode: string
    /**
     * The end-user verification code.
     */
    userCode: string
    /**
     * The end-user verification URI on the authorization server.
     */
    verificationURI: string
    /**
     * The end-user verification URI with the user code embedded, per the authorization server's instructions.
     */
    verificationURIComplete?: string
    /**
     * The lifetime in seconds of the device code and the user code.
     */
    expiresIn: number
    /**
     * The minimum amount of time in seconds that the client SHOULD wait between polling requests to the token endpoint.
     */
    interval?: number
}

export interface DeviceSession<DefaultUser = User> {
    accessToken: string
    tokenType: string
    expiresIn?: number
    refreshToken?: string
    scope?: string
    user: DefaultUser
}
