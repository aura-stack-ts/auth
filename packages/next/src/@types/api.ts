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
    SignUpAPIOptions,
    SignUpAPIReturn,
    RefreshUserInfoAPIOptions,
    RevokeTokenAPIOptions,
    RevokeTokenAPIReturn,
    DisconnectProviderAPIOptions,
    ProviderConnectedAPIOptions,
    LiteralUnion,
    BuiltInOAuthProvider,
    DisconnectProviderAPIReturn,
    ProviderConnectedAPIReturn,
    RefreshUserInfoAPIReturn,
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

/**
 * Return type for the Next.js server `api.signUp` helper.
 * Same `never` rule as {@link NextSignInReturn} when a server redirect is triggered via options.
 */
export type NextSignUpReturn<Options extends SignUpAPIOptions> = Options extends { redirect: true }
    ? never
    : Options extends { redirectTo: string }
      ? never
      : SignUpAPIReturn

export interface NextAPI<DefaultUser extends User = User> {
    getSession: (options?: any) => Promise<any>
    signIn: <Options extends SignInAPIOptions>(
        provider: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<NextSignInReturn<Options>>
    signInCredentials: <Options extends SignInCredentialsAPIOptions>(options: Options) => Promise<NextSignInCredentials<Options>>
    updateSession: <Options extends NextUpdateSessionOptions<DefaultUser>>(
        options: Options
    ) => Promise<NextUpdateSessionReturn<Options, DefaultUser>>
    getProviderTokens: (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: any) => Promise<any>
    getAccessToken: (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: any) => Promise<any>
    signOut: <Options extends SignOutAPIOptions>(options?: Partial<Options>) => Promise<NextSignOutReturn<Options>>
    signUp: <Options extends SignUpAPIOptions>(options: Options) => Promise<NextSignUpReturn<Options>>
    refreshUserInfo: <Options extends RefreshUserInfoAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<RefreshUserInfoAPIReturn>
    revokeToken: <Options extends RevokeTokenAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<RevokeTokenAPIReturn>
    disconnectProvider: <Options extends DisconnectProviderAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<DisconnectProviderAPIReturn>
    isProviderConnected: <Options extends ProviderConnectedAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<ProviderConnectedAPIReturn>
}
