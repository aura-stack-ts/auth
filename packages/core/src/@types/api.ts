import type { CredentialsPayload } from "@/@types/config.ts"
import type { RequestHeaders } from "@aura-stack/router/types"
import type { AuthActionAPIReturn } from "@/@types/internal.ts"
import type { DeepPartial, RequiredKeys } from "@/@types/utility.ts"
import type { OAuthTokenPayload, Session, User } from "@/@types/session.ts"

export interface APIOptionsWithRedirectTo {
    /**
     * Optional redirect strategy for server/programmatic API functions.
     *
     * - `true`: The response includes a `Location` header.
     * - `false`: the API returns redirect data (`signInURL` or `redirectURL`) for custom handling.
     *
     * Defaults are action-specific; see each API option type.
     * @experimental
     */
    redirect?: boolean
    /**
     * Optional destination after a successful action.
     *
     * Validation includes:
     * - same-origin checks using the URL derived from `request`/`headers` and configured base URL
     * - `trustedOrigins` checks from auth configuration
     * @experimental
     * @example
     * // with `request`
     * const response = await api.signIn("github", {
     *   redirectTo: "/dashboard",
     *   request: await getRequest(),
     * })
     *
     * // with `baseURL`
     * const { api: { signIn } } = await createAuth({
     *   oauth: ["github"],
     *   baseURL: "https://example.com"
     * })
     *
     * const response = await signIn("github", {
     *   redirectTo: "https://example.com/dashboard",
     * })
     */
    redirectTo?: string
    /**
     * Fallback redirect destination used when a target redirect URL is untrusted or invalid.
     * Overrides the global `fallbackRedirectTo` option configured in `createAuth`.
     *
     * @default "/"
     */
    fallbackRedirectTo?: string
}

export interface APIOptionsWithRequest {
    /**
     * Optional `Request` object, useful for constructing the incoming URL on the server side.
     * This option is required when the `redirectTo` option is defined, to ensure the `redirectTo`
     * URL is same-origin or included in the `trustedOrigins` configuration option.
     */
    request?: Request
    /**
     * Optional `HeadersInit` object, useful for constructing the incoming URL from proxy headers
     * such as `X-Forwarded-Host` and `X-Forwarded-Proto` when the auth instance is behind a proxy
     * or load balancer, or when the URL is built from headers instead of the `Request` object.
     * This option requires enabling the `trustedProxyHeaders` option in the global configuration.
     */
    headers?: HeadersInit | RequestHeaders
}

export interface APIOptionsWithSkipCSRFCheck {
    /**
     * Optional `skipCSRFCheck` flag to bypass the Double-Submit Cookie validation.
     *
     * The CSRF token is still required and validated to preserve request integrity.
     * Use this only for trusted server-side flows.
     * @default `false`
     * @deprecated Use `doubleSubmitToken` to provide the CSRF token explicitly instead of skipping the check.
     */
    skipCSRFCheck?: boolean
    /**
     * Optional token used to perform Double-Submit Cookie validation.
     *
     * By default, server-side API functions skip the Double-Submit Cookie validation
     * because they execute in a trusted server environment where the CSRF token is
     * not directly available. Providing this value enables the same Double-Submit
     * Cookie validation performed by the HTTP endpoints.
     *
     * Other CSRF protections remain enabled regardless of whether this option is
     * provided.
     *
     * @example
     * api.signOut({
     *   doubleSubmitToken: "csrf-token-value",
     * })
     */
    doubleSubmitToken?: string
}

/** Options to get the current session. */
export interface GetSessionAPIOptions {
    /** The headers containing the `session_token` cookie */
    headers: HeadersInit | RequestHeaders
}

/** Programmatic `getSession` result with session payload and `toResponse()` metadata. */
export type GetSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<
    { success: true; session: Session<DefaultUser> } | { success: false; session: null }
>

export type SignInReturnData =
    /** redirect: true & redirectTo: string */
    | { success: true; redirect: true; signInURL: string }
    /** redirect: false & redirectTo: string */
    | { success: true; redirect: false; signInURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    | { success: false; redirect: false; signInURL: null }

/**
 * Server/programmatic options for `signIn` API.
 */
export interface SignInAPIOptions extends APIOptionsWithRequest, APIOptionsWithRedirectTo {}

/**
 * Server/programmatic `signIn` result.
 *
 * Includes `signInURL` and response metadata to support both framework-managed redirects
 * and custom response handling through `toResponse()`.
 */
export type SignInAPIReturn = AuthActionAPIReturn<SignInReturnData>

export type APIFunctionReturnData =
    /** redirect: true & redirectTo: string */
    | { success: true; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; redirect: false; redirectURL: string }
    /** redirect: true & redirectTo: null | undefined (not set) */
    /** redirect: false & redirectTo: null | undefined (not set) */
    | { success: true; redirect: false; redirectURL: null }
    /** Failed */
    | { success: false; redirect: false; redirectURL: null }

export type ClientSideReturnData = APIFunctionReturnData

export type SignInCredentialsReturnData = APIFunctionReturnData

/** Server/programmatic credentials sign-in options. */
export interface SignInCredentialsAPIOptions
    extends APIOptionsWithRequest, APIOptionsWithRedirectTo, APIOptionsWithSkipCSRFCheck {
    /**
     * Credentials payload validated by the configured `credentials.authorize` function.
     * @example
     * {
     *   username: "johndoe",
     *   password: "1234567890"
     * }
     */
    payload: CredentialsPayload
}

/** Programmatic credentials sign-in result with response metadata and `toResponse()`. */
export type SignInCredentialsAPIReturn = AuthActionAPIReturn<SignInCredentialsReturnData>

export type SignOutReturnData = APIFunctionReturnData

/** Server/programmatic options for `signOut` API. */
export interface SignOutAPIOptions
    extends RequiredKeys<APIOptionsWithRequest, "headers">, APIOptionsWithRedirectTo, APIOptionsWithSkipCSRFCheck {}

/** Programmatic sign-out result with redirect metadata and `toResponse()`. */
export type SignOutAPIReturn = AuthActionAPIReturn<SignOutReturnData>

export type UpdateSessionReturnData<DefaultUser extends User = User> =
    /** redirect: true & redirectTo: string */
    | { success: true; session: Session<DefaultUser>; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; session: Session<DefaultUser>; redirect: false; redirectURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    | { success: true; session: Session<DefaultUser>; redirect: false; redirectURL: null }
    /** Failed session update */
    | { success: false; session: null; redirect: false; redirectURL: null }

/** Server/programmatic options for `updateSession` API. */
export interface UpdateSessionAPIOptions<DefaultUser extends User = User>
    extends RequiredKeys<APIOptionsWithRequest, "headers">, APIOptionsWithRedirectTo, APIOptionsWithSkipCSRFCheck {
    /**
     * Partial session payload used to update the current session.
     * @see Session
     * @example
     * session: {
     *   user: {
     *     name: "John Doe",
     *     email: "john.doe@example.com"
     *   }
     * }
     */
    session: DeepPartial<Session<DefaultUser>>
}

/** Programmatic session update result with redirect metadata and `toResponse()`. */
export type UpdateSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<UpdateSessionReturnData<DefaultUser>>

export interface SignUpAPIOptions<Payload extends Record<string, any> = Record<string, any>>
    extends APIOptionsWithRequest, APIOptionsWithRedirectTo, APIOptionsWithSkipCSRFCheck {
    payload: Payload
}

export type SignUpReturnData = APIFunctionReturnData

/** Programmatic sign-up result with redirect metadata and `toResponse()`. */
export type SignUpAPIReturn = AuthActionAPIReturn<SignUpReturnData>

/**
 * Programmatic options for `getProviderTokens` API.
 */
export interface GetProviderTokensAPIOptions extends Pick<APIOptionsWithRequest, "headers" | "request"> {}

export type GetProviderTokensData = { success: true; tokens: OAuthTokenPayload } | { success: false; tokens: null }

/**
 * Programmatic result for `getProviderTokens` API with response metadata and `toResponse()`.
 */
export type GetProviderTokensAPIReturn = AuthActionAPIReturn<GetProviderTokensData>

/**
 * Programmatic options for `getAccessToken` API.
 */
export type AccessTokenAPIOptions = GetProviderTokensAPIOptions

export type AccessTokenData = { success: true; accessToken: string } | { success: false; accessToken: null }

/**
 * Programmatic result for `getAccessToken` API with response metadata and `toResponse()`.
 */
export type AccessTokenAPIReturn = AuthActionAPIReturn<AccessTokenData>

/**
 * Programmatic options for `refreshUserInfo` API.
 */
export interface RefreshUserInfoAPIOptions extends APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {}

export type RefreshUserInfoData<DefaultUser extends User = User> =
    | { success: true; session: Session<DefaultUser> }
    | { success: false; session: null }

/**
 * Programmatic result for `refreshUserInfo` API with response metadata and `toResponse()`.
 */
export type RefreshUserInfoAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<RefreshUserInfoData<DefaultUser>>

/**
 * Programmatic options for `revokeToken` API.
 */
export interface RevokeTokenAPIOptions extends APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {}

export type RevokeTokenData = { success: true } | { success: false }

/**
 * Programmatic result for `revokeToken` API with response metadata and `toResponse()`.
 */
export type RevokeTokenAPIReturn = AuthActionAPIReturn<RevokeTokenData>

/**
 * Programmatic options for `disconnectProvider` API.
 */
export interface DisconnectProviderAPIOptions extends APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {}

export type DisconnectProviderData = { success: true } | { success: false }

/**
 * Programmatic result for `disconnectProvider` API with response metadata and `toResponse()`.
 */
export type DisconnectProviderAPIReturn = AuthActionAPIReturn<DisconnectProviderData>

export type ProviderConnectedAPIOptions = APIOptionsWithRequest

export type ProviderConnectedData = { success: true; connected: boolean } | { success: false; connected: false }

export type ProviderConnectedAPIReturn = AuthActionAPIReturn<ProviderConnectedData>

export type SendVerificationEmailData = APIFunctionReturnData

/** Programmatic options for `sendVerificationEmail` API. */
export type SendVerificationEmailAPIOptions = APIOptionsWithRequest & APIOptionsWithRedirectTo & APIOptionsWithSkipCSRFCheck

/** Programmatic result for `sendVerificationEmail` API with response metadata and `toResponse()`. */
export type SendVerificationEmailAPIReturn = AuthActionAPIReturn<SendVerificationEmailData>

export type VerifyEmailData = APIFunctionReturnData

/** Programmatic options for `verifyEmail` API. */
export type VerifyEmailAPIOptions = APIOptionsWithRequest & APIOptionsWithRedirectTo

/** Programmatic result for `verifyEmail` API with response metadata and `toResponse()`. */
export type VerifyEmailAPIReturn = AuthActionAPIReturn<VerifyEmailData>

export type ForgotPasswordData = APIFunctionReturnData

/** Programmatic options for `forgotPassword` API. */
export type ForgotPasswordAPIOptions = APIOptionsWithRequest & APIOptionsWithRedirectTo

/** Programmatic result for `forgotPassword` API with response metadata and `toResponse()`. */
export type ForgotPasswordAPIReturn = AuthActionAPIReturn<ForgotPasswordData>

export type ResetPasswordData = APIFunctionReturnData

/** Programmatic options for `resetPassword` API. */
export type ResetPasswordAPIOptions = APIOptionsWithRequest &
    APIOptionsWithRedirectTo & {
        payload: {
            token: string
            newPassword: string
        }
    }

/** Programmatic result for `resetPassword` API with response metadata and `toResponse()`. */
export type ResetPasswordAPIReturn = AuthActionAPIReturn<ResetPasswordData>

export type ChangePasswordData = APIFunctionReturnData

/** Programmatic options for `changePassword` API. */
export type ChangePasswordAPIOptions = APIOptionsWithRequest &
    APIOptionsWithRedirectTo &
    APIOptionsWithSkipCSRFCheck & {
        payload: {
            currentPassword: string
            newPassword: string
        }
    }

/** Programmatic result for `changePassword` API with response metadata and `toResponse()`. */
export type ChangePasswordAPIReturn = AuthActionAPIReturn<ChangePasswordData>

export type ChangeEmailData = APIFunctionReturnData

/** Programmatic options for `changeEmail` API. */
export type ChangeEmailAPIOptions = APIOptionsWithRequest &
    APIOptionsWithRedirectTo &
    APIOptionsWithSkipCSRFCheck & {
        payload: {
            currentPassword: string
            newEmail: string
        }
    }

/** Programmatic result for `changeEmail` API with response metadata and `toResponse()`. */
export type ChangeEmailAPIReturn = AuthActionAPIReturn<ChangeEmailData>

export type VerifyEmailChangeData = APIFunctionReturnData

/** Programmatic options for `verifyEmailChange` API. */
export type VerifyEmailChangeAPIOptions = APIOptionsWithRequest &
    APIOptionsWithRedirectTo &
    APIOptionsWithSkipCSRFCheck & {
        payload: {
            token: string
        }
    }

/** Programmatic result for `verifyEmailChange` API with response metadata and `toResponse()`. */
export type VerifyEmailChangeAPIReturn = AuthActionAPIReturn<VerifyEmailChangeData>

export type CancelEmailChangeData = APIFunctionReturnData

/** Programmatic options for `cancelEmailChange` API. */
export type CancelEmailChangeAPIOptions = APIOptionsWithRequest &
    APIOptionsWithRedirectTo &
    APIOptionsWithSkipCSRFCheck & { payload?: { token: string } }

/** Programmatic result for `cancelEmailChange` API with response metadata and `toResponse()`. */
export type CancelEmailChangeAPIReturn = AuthActionAPIReturn<CancelEmailChangeData>

export type SendMagicLinkData = APIFunctionReturnData

/** Programmatic options for `sendMagicLink` API. */
export type SendMagicLinkAPIOptions = APIOptionsWithRequest & APIOptionsWithRedirectTo & APIOptionsWithSkipCSRFCheck

/** Programmatic result for `sendMagicLink` API with response metadata and `toResponse()`. */
export type SendMagicLinkAPIReturn = AuthActionAPIReturn<SendMagicLinkData>

export type VerifyMagicLinkData = SendMagicLinkData

/** Programmatic options for `verifyMagicLink` API. */
export type VerifyMagicLinkAPIOptions = APIOptionsWithRequest & APIOptionsWithRedirectTo

/** Programmatic result for `verifyMagicLink` API with response metadata and `toResponse()`. */
export type VerifyMagicLinkAPIReturn = AuthActionAPIReturn<VerifyMagicLinkData>
