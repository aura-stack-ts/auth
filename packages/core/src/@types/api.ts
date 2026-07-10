import type { OAuthTokenPayload, Session, User } from "@/@types/session.ts"
import type { AuthResponse, DeepPartial, Prettify, RequiredKeys } from "@/@types/utility.ts"
import type { CredentialsPayload, RouterGlobalContext } from "@/@types/config.ts"

/**
 * Canonical return shape for server/programmatic API functions.
 *
 * - Success branch includes the payload fields from `Body` plus response metadata.
 * - Failure branch includes `error` metadata and `toResponse()` for framework adapters.
 * - Both branches expose `headers` so callers can forward cookies and auth-related headers.
 *
 * @typeParam Body - Union of success/failure payload variants.
 * @typeParam ErrorCodes - Error code union for the failure branch (`error.code`).
 */
type AuthActionAPIReturn<Body extends object, ErrorCodes = any> =
    | (Extract<Body, { success: true }> & { headers: Headers; toResponse: () => AuthResponse<Exclude<Body, { success: false }>> })
    | (Extract<Body, { success: false }> & {
          success: false
          headers: Headers
          /** @todo: Add `docs` property */
          error: { code: ErrorCodes; message: string }
          toResponse: () => AuthResponse<Exclude<Body, { success: true }>>
      })

/**
 * Utility to merge the internal router global context (`ctx`) with per-function options.
 * Used by implementation-level API functions in `src/api/*`.
 */
export type FunctionAPIContext<Options extends object = {}> = Prettify<
    {
        ctx: RouterGlobalContext
    } & Options
>

export interface OptionsWithRedirectTo {
    /**
     * Optional `redirect` flag used by `createAuthClient` to control client-side navigation behavior.
     *
     * By default, navigation is performed with `location.assign()`.
     * When set to `false`, the API returns `redirectURL` so the caller can handle navigation manually.
     * @default `true`
     * @example
     * redirect: true
     */
    redirect?: boolean
    /**
     * Optional destination after a successful action.
     *
     * Supports relative paths and absolute URLs. The value is validated against `trustedOrigins`
     * to ensure redirects are allowed.
     * @example
     * redirectTo: "/dashboard"
     * redirectTo: "https://example.com/dashboard"
     */
    redirectTo?: string
}

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
}

export interface APIOptionsWithRequest extends APIOptionsWithRedirectTo {
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
    headers?: HeadersInit
}

export interface APIOptionsWithSkipCSRFCheck {
    /**
     * Optional `skipCSRFCheck` flag to bypass the Double-Submit Cookie validation.
     *
     * The CSRF token is still required and validated to preserve request integrity.
     * Use this only for trusted server-side flows.
     * @default `false`
     */
    skipCSRFCheck?: boolean
}

/** Options to get the current session. */
export interface GetSessionAPIOptions {
    /** The headers containing the `session_token` cookie */
    headers: HeadersInit
}

/** Programmatic `getSession` result with session payload and `toResponse()` metadata. */
export type GetSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<
    { success: true; session: Session<DefaultUser> } | { success: false; session: null }
>

/**
 * Client-side options for `createAuthClient().signIn(...)`.
 */
export interface SignInOptions extends OptionsWithRedirectTo {}

/**
 * Client-side `signIn` return type.
 *
 * - Redirect mode (`redirect: true`): returns `void` because navigation is handled by the client.
 * - Manual mode (`redirect: false`): returns `signInURL` for caller-controlled navigation.
 */
export type SignInReturn<Options extends SignInOptions> = Options extends { redirect: false }
    ? { success: true; redirect: false; signInURL: string } | { success: false; redirect: false; signInURL: null }
    : void

/**
 * Server/programmatic options for `signIn` API.
 */
export interface SignInAPIOptions extends APIOptionsWithRedirectTo, APIOptionsWithRequest {}

/**
 * Server/programmatic `signIn` result.
 *
 * Includes `signInURL` and response metadata to support both framework-managed redirects
 * and custom response handling through `toResponse()`.
 */
export type SignInAPIReturn = AuthActionAPIReturn<
    | {
          success: true
          redirect: boolean
          signInURL: string
      }
    | {
          success: false
          redirect: false
          signInURL: null
      }
>

export interface SignInCredentialsOptions extends OptionsWithRedirectTo {
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

export type SignInCredentialsReturnData =
    /** redirect: true & redirectTo: string */
    | { success: true; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; redirect: false; redirectURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    /** redirect: true & redirectTo: null | undefined (not set) */
    | { success: true; redirect: false; redirectURL: null }
    /** Failed credentials */
    | { success: false; redirect: false; redirectURL: null }

/** Client-side credentials sign-in return type (redirect mode or manual redirect data). */
export type SignInCredentialsReturn<Options extends SignInCredentialsOptions> = Options extends { redirect: false }
    ? Extract<SignInCredentialsReturnData, { redirect: false }>
    : void

/** Server/programmatic credentials sign-in options. */
export interface SignInCredentialsAPIOptions
    extends APIOptionsWithRedirectTo, APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {
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

/** Client-side sign-out options. */
export interface SignOutOptions extends OptionsWithRedirectTo {}

export type SignOutReturnData =
    /** redirect: true & redirectTo: string */
    | { success: true; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; redirect: false; redirectURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    /** redirect: true & redirectTo: null | undefined (not set) */
    | { success: true; redirect: false; redirectURL: null }
    /** Failed */
    | { success: false; redirect: false; redirectURL: null }

/** Client-side sign-out return type (redirect mode or manual redirect data). */
export type SignOutReturn<Options extends SignOutOptions> = Options extends { redirect: false }
    ? Extract<SignOutReturnData, { redirect: false }>
    : void

/** Server/programmatic options for `signOut` API. */
export interface SignOutAPIOptions extends RequiredKeys<APIOptionsWithRequest, "headers">, APIOptionsWithSkipCSRFCheck {}

/** Programmatic sign-out result with redirect metadata and `toResponse()`. */
export type SignOutAPIReturn = AuthActionAPIReturn<SignOutReturnData>

/** Client-side `updateSession` options: partial session payload plus optional redirect behavior. */
export interface UpdateSessionOptions<DefaultUser extends User = User> extends OptionsWithRedirectTo {
    /** Partial session data to merge into the current session. */
    session: DeepPartial<Session<DefaultUser>>
}

export type UpdateSessionReturnData<DefaultUser extends User = User> =
    /** redirect: true & redirectTo: string */
    | { success: true; session: Session<DefaultUser>; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; session: Session<DefaultUser>; redirect: false; redirectURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    | { success: true; session: Session<DefaultUser>; redirect: false; redirectURL: null }
    /** Failed session update */
    | { success: false; session: null; redirect: false; redirectURL: null }

/** Client-side `updateSession` return type. */
export type UpdateSessionReturn<
    Options extends UpdateSessionOptions<DefaultUser>,
    DefaultUser extends User = User,
> = Options extends {
    redirect: false
}
    ? Extract<UpdateSessionReturnData<DefaultUser>, { redirect: false }>
    : void

/** Server/programmatic options for `updateSession` API. */
export interface UpdateSessionAPIOptions<DefaultUser extends User = User>
    extends RequiredKeys<APIOptionsWithRequest, "headers">, APIOptionsWithSkipCSRFCheck {
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
    extends APIOptionsWithRedirectTo, APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {
    payload: Payload
}

export type SignUpReturnData =
    /** redirect: true & redirectTo: string */
    | { success: true; redirect: true; redirectURL: null }
    /** redirect: false & redirectTo: string */
    | { success: true; redirect: false; redirectURL: string }
    /** redirect: false & redirectTo: null | undefined (not set) */
    /** redirect: true & redirectTo: null | undefined (not set) */
    | { success: true; redirect: false; redirectURL: null }
    /** Failed sign-up */
    | { success: false; redirect: false; redirectURL: null }

/** Programmatic sign-up result with redirect metadata and `toResponse()`. */
export type SignUpAPIReturn = AuthActionAPIReturn<SignUpReturnData>

/**
 * Client-side `signUp` options: payload plus optional redirect behavior.
 */
export type SignUpOptions<SignUpSchema extends Record<string, any> = Record<string, any>> = OptionsWithRedirectTo & {
    payload: SignUpSchema
}

/**
 * Client-side `signUp` return type.
 *
 * - Redirect mode (`redirect: true`): returns `void` because navigation is handled by the client.
 * - Manual mode (`redirect: false`): returns `redirectURL` for caller-controlled navigation.
 */
export type SignUpReturn<Options extends SignUpOptions> = Options extends { redirect: false }
    ? Extract<SignUpReturnData, { redirect: false }>
    : void

/**
 * Programmatic options for `getProviderTokens` API.
 */
export interface GetProviderTokensAPIOptions
    extends Pick<APIOptionsWithRequest, "headers" | "request">, APIOptionsWithSkipCSRFCheck {}

export type GetProviderTokensData = { success: true; tokens: OAuthTokenPayload } | { success: false; tokens: null }

/**
 * Programmatic result for `getProviderTokens` API with response metadata and `toResponse()`.
 */
export type GetProviderTokensAPIReturn = AuthActionAPIReturn<GetProviderTokensData>

/**
 * Client-side `getProviderTokens` return type.
 */
export type GetProviderTokensReturn = GetProviderTokensData

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
export type RefreshUserInfoAPIOptions = Pick<APIOptionsWithRequest, "headers" | "request"> & APIOptionsWithSkipCSRFCheck

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
export type RevokeTokenAPIOptions = Pick<APIOptionsWithRequest, "headers" | "request"> & APIOptionsWithSkipCSRFCheck

export type RevokeTokenData = { success: true } | { success: false }

/**
 * Programmatic result for `revokeToken` API with response metadata and `toResponse()`.
 */
export type RevokeTokenAPIReturn = AuthActionAPIReturn<RevokeTokenData>

/**
 * Programmatic options for `disconnectProvider` API.
 */
export type DisconnectProviderAPIOptions = APIOptionsWithRequest & APIOptionsWithSkipCSRFCheck

export type DisconnectProviderData = { success: true } | { success: false }

/**
 * Programmatic result for `disconnectProvider` API with response metadata and `toResponse()`.
 */
export type DisconnectProviderAPIReturn = AuthActionAPIReturn<DisconnectProviderData>
