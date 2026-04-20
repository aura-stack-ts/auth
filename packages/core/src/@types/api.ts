import type { Prettify } from "@aura-stack/jose"
import type { Session, User } from "@/@types/session.ts"
import type { AuthResponse, DeepPartial } from "@/@types/utility.ts"
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
export type FunctionAPIContext<Options extends object> = Prettify<
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
     * - `true`: the generated response is a redirect response.
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

/** Client-side credentials sign-in return type (redirect mode or manual redirect data). */
export type SignInCredentialsReturn<Options extends SignInCredentialsOptions> = Options extends { redirect: false }
    ? { success: true; redirectURL: string } | { success: false; redirectURL: null }
    : void

/** Server/programmatic credentials sign-in options. */
export interface SignInCredentialsAPIOptions extends APIOptionsWithRedirectTo, APIOptionsWithRequest {
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
export type SignInCredentialsAPIReturn = AuthActionAPIReturn<
    { success: true; redirectURL: string } | { success: false; redirectURL: null }
>

/** Client-side sign-out options. */
export interface SignOutOptions extends OptionsWithRedirectTo {}

/** Client-side sign-out return type (redirect mode or manual redirect data). */
export type SignOutReturn<Options extends SignOutOptions> = Options extends { redirect: false }
    ? { success: true; redirect: false; redirectURL: string } | { success: false; redirect: false; redirectURL: null }
    : void

/** Server/programmatic options for `signOut` API. */
export interface SignOutAPIOptions extends APIOptionsWithRedirectTo, APIOptionsWithSkipCSRFCheck {
    /**
     * Required headers used to execute sign-out.
     * Must include `session_token` and `csrf_token` cookies for CSRF validation.
     * @example
     * {
     *   Cookie: "session_token=abc123; csrf_token=def456"
     * }
     */
    headers: HeadersInit
    /**
     * Optional `Request` object as an alternative to manually providing `headers`.
     */
    request?: Request
}

/** Programmatic sign-out result with redirect metadata and `toResponse()`. */
export type SignOutAPIReturn = AuthActionAPIReturn<
    { success: true; redirect: boolean; redirectURL: string } | { success: false; redirect: boolean; redirectURL: null }
>

/** Client-side `updateSession` options: partial session payload plus optional redirect behavior. */
export interface UpdateSessionOptions<DefaultUser extends User = User> extends OptionsWithRedirectTo {
    /** Partial session data to merge into the current session. */
    session: DeepPartial<Session<DefaultUser>>
}

/** Client-side `updateSession` return type. */
export type UpdateSessionReturn<Options extends UpdateSessionOptions, DefaultUser extends User = User> = Options extends {
    redirect: false
}
    ? { success: true; session: Session<DefaultUser> } | { success: false; session: null }
    : void

/** Server/programmatic options for `updateSession` API. */
export interface UpdateSessionAPIOptions<DefaultUser extends User = User>
    extends APIOptionsWithRequest, APIOptionsWithSkipCSRFCheck {
    /**
     * Required headers used to execute session update.
     * Must include `session_token` and `csrf_token` cookies for CSRF validation.
     * @example
     * {
     *  Cookie: "session_token=abc123; csrf_token=def456"
     * }
     */
    headers: HeadersInit
    /**
     * Optional `Request` object as an alternative to manually providing `headers`.
     */
    request?: Request
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
export type UpdateSessionAPIReturn<DefaultUser extends User = User> = AuthActionAPIReturn<
    { success: true; session: Session<DefaultUser>; redirectURL: string } | { success: false; session: null; redirectURL: null }
>
