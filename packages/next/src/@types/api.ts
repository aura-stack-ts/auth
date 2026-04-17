/**
 * Next.js App Router integration types for the helpers returned by `createAuth` from `@aura-stack/next`.
 *
 * These conditional types describe return values when `redirect()` is used (which never returns in Next.js).
 */
import type {
    SignInAPIOptions,
    SignInAPIReturn,
    SignInCredentialsAPIReturn,
    SignOutAPIOptions,
    SignOutAPIReturn,
} from "@aura-stack/react/types"

/**
 * Return type for the Next.js server `api.signIn` helper (see `packages/next/src/lib/api.ts`).
 * When `Options` includes `redirect: true`, the helper calls `redirect()` and the type is `never` because execution does not continue.
 */
export type NextSignInReturn<Options extends SignInAPIOptions> = Options extends { redirect: true } ? never : SignInAPIReturn

/**
 * Return type for the Next.js server `api.signInCredentials` helper.
 * Same `never` rule as {@link NextSignInReturn} when a server redirect is triggered via options.
 */
export type NextSignInCredentials<Options extends SignInAPIOptions> = Options extends { redirect: true }
    ? never
    : SignInCredentialsAPIReturn

/**
 * Return type for the Next.js server `api.signOut` helper.
 * When `Options` includes a `redirectTo` string and the core API performs a redirect response, Next’s `redirect()` is invoked and the type is `never`.
 */
export type NextSignOutReturn<Options extends SignOutAPIOptions> = Options extends { redirectTo: string }
    ? never
    : SignOutAPIReturn
