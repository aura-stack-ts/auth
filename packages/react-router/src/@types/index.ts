/**
 * React Router (framework) integration types: options include the current `Request`, and result types
 * distinguish JSON API results from full `Response` objects when returning from loaders/actions.
 */
import type {
    Prettify,
    SignInAPIOptions,
    SignInAPIReturn,
    SignInCredentialsAPIOptions,
    SignInCredentialsAPIReturn,
    SignOutAPIOptions,
} from "@/@types/core"

export type * from "./core"

/** Core `signIn` options plus the incoming `Request` (required in React Router data APIs). */
export type ReactRouterSignInAPIOptions = Prettify<SignInAPIOptions & { request: Request }>

/** Credentials sign-in options plus `request` and an optional `redirect` flag matching the server helper behavior. */
export type ReactRouterSignInCredentialsAPIOptions = Prettify<
    SignInCredentialsAPIOptions & {
        request: Request
        redirect?: boolean
    }
>

/** Sign-out options plus the incoming `Request` for cookie and CSRF handling. */
export type ReactRouterSignOutAPIOptions = Prettify<SignOutAPIOptions & { request: Request }>

/**
 * Result of the React Router `api.signIn` helper: the JSON API object when `redirect: false`,
 * otherwise the `Response` from `toResponse()` (redirect / navigation response).
 */
export type ReactRouterSignInReturn<Options extends ReactRouterSignInAPIOptions> = Options extends {
    redirect: false
}
    ? SignInAPIReturn
    : Response

/**
 * Result of the React Router `api.signInCredentials` helper: same discriminant as {@link ReactRouterSignInReturn}.
 */
export type ReactRouterSignInCredentialsReturn<Options extends ReactRouterSignInCredentialsAPIOptions> = Options extends {
    redirect: false
}
    ? SignInCredentialsAPIReturn
    : Response
