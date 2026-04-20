/**
 * Next.js App Router integration types for the helpers returned by `createAuth` from `@aura-stack/next`.
 *
 * These conditional types describe return values when `redirect()` is used (which never returns in Next.js).
 */
import type {
    Prettify,
    SignInAPIOptions,
    SignInAPIReturn,
    SignInCredentialsAPIOptions,
    SignInCredentialsAPIReturn,
    SignOutAPIOptions,
    SignOutAPIReturn,
    UpdateSessionAPIOptions,
    UpdateSessionAPIReturn,
    User,
} from "@aura-stack/react/types"

/**
 * Return type for the Next.js server `api.signIn` helper (see `packages/next/src/lib/api.ts`).
 * When `Options` includes `redirect: true`, the helper calls `redirect()` and the type is `never` because execution does not continue.
 */
export type NextSignInReturn<Options extends SignInAPIOptions> = Options extends { redirect: true }
    ? never
    : Options extends { redirectTo: string }
      ? never
      : SignInAPIReturn

/**
 * Return type for the Next.js server `api.signInCredentials` helper.
 * Same `never` rule as {@link NextSignInReturn} when a server redirect is triggered via options.
 */
export type NextSignInCredentials<Options extends SignInCredentialsAPIOptions> = Options extends { redirect: true }
    ? never
    : Options extends { redirectTo: string }
      ? never
      : SignInCredentialsAPIReturn

export type NextUpdateSessionOptions<DefaultUser extends User = User> = Prettify<
    Omit<UpdateSessionAPIOptions<DefaultUser>, "headers"> & { headers?: HeadersInit }
>

/**
 * Return type for the Next.js server `api.updateSession` helper.
 */
export type NextUpdateSessionReturn<
    Options extends NextUpdateSessionOptions<DefaultUser>,
    DefaultUser extends User = User,
> = Options extends {
    redirect: true
}
    ? never
    : Options extends { redirectTo: string }
      ? never
      : UpdateSessionAPIReturn<DefaultUser>

/**
 * Return type for the Next.js server `api.signOut` helper.
 * When `Options` includes a `redirectTo` string and the core API performs a redirect response, Next’s `redirect()` is invoked and the type is `never`.
 */
export type NextSignOutReturn<Options extends SignOutAPIOptions> = Options extends { redirectTo: string }
    ? never
    : SignOutAPIReturn
