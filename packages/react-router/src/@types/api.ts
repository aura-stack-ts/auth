/**
 * React Router (framework) integration types: options include the current `Request`, and result types
 * distinguish JSON API results from full `Response` objects when returning from loaders/actions.
 */
import type {
    Prettify,
    GetSessionAPIOptions,
    SignInAPIOptions,
    SignInAPIReturn,
    SignInCredentialsAPIOptions,
    SignInCredentialsAPIReturn,
    SignOutAPIOptions,
    SignOutAPIReturn,
    UpdateSessionAPIOptions,
    UpdateSessionAPIReturn,
    UpdateSessionOptions,
    User,
    Session,
    GetProviderTokensAPIReturn,
    AccessTokenAPIOptions,
    AccessTokenAPIReturn,
    SignUpAPIOptions,
    SignUpAPIReturn,
    RefreshUserInfoAPIOptions,
    RefreshUserInfoAPIReturn,
    RevokeTokenAPIOptions,
    RevokeTokenAPIReturn,
    DisconnectProviderAPIOptions,
    DisconnectProviderAPIReturn,
    ProviderConnectedAPIOptions,
    ProviderConnectedAPIReturn,
} from "@aura-stack/react/types"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/react/types"

/** Core `signIn` options plus the incoming `Request` (required in React Router data APIs). */
export type ReactRouterSignInAPIOptions = Prettify<
    SignInAPIOptions & {
        request: Request
    }
>

/**
 * Credentials sign-in options plus `request` and an optional `redirect` flag matching the server helper behavior.
 */
export type ReactRouterSignInCredentialsAPIOptions = Prettify<
    SignInCredentialsAPIOptions & {
        request: Request
        redirect?: boolean
    }
>

/** Sign-out options plus the incoming `Request` for cookie and CSRF handling. */
export type ReactRouterSignOutAPIOptions = Prettify<Partial<SignOutAPIOptions> & { request: Request }>

export type ReactRouterSignOutReturn<Options extends ReactRouterSignOutAPIOptions> = Options extends { redirect: false }
    ? SignOutAPIReturn
    : Response

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
 * Result of the React Router `api.signInCredentials` helper: same discriminant.
 */
export type ReactRouterSignInCredentialsReturn<Options extends ReactRouterSignInCredentialsAPIOptions> = Options extends {
    redirect: false
}
    ? SignInCredentialsAPIReturn
    : Response

export type ReactRouterUpdateSessionAPIOptions<DefaultUser extends User = User> = Prettify<
    Partial<UpdateSessionAPIOptions<DefaultUser>> & { request: Request; session: UpdateSessionOptions<DefaultUser>["session"] }
>

export type ReactRouterUpdateSessionReturn<
    Options extends ReactRouterUpdateSessionAPIOptions<DefaultUser>,
    DefaultUser extends User = User,
> = Options extends {
    redirect: false
}
    ? UpdateSessionAPIReturn<DefaultUser>
    : Response

export type ReactRouterSignUpAPIOptions = Prettify<SignUpAPIOptions & { request: Request }>

export type ReactRouterSignUpReturn<Options extends ReactRouterSignUpAPIOptions> = Options extends {
    redirect: false
}
    ? SignUpAPIReturn
    : Response

export type ReactRouterRefreshUserInfoAPIOptions = Prettify<RefreshUserInfoAPIOptions & { request: Request }>

export type ReactRouterRevokeTokenAPIOptions = Prettify<RevokeTokenAPIOptions & { request: Request }>

export type ReactRouterDisconnectProviderAPIOptions = Prettify<DisconnectProviderAPIOptions & { request: Request }>

export type ReactRouterProviderConnectedAPIOptions = Prettify<ProviderConnectedAPIOptions & { request: Request }>

export interface ReactRouterAPI<DefaultUser extends User = User> {
    getSession: (options: GetSessionAPIOptions) => Promise<Session<DefaultUser> | null>
    signIn: <Options extends ReactRouterSignInAPIOptions>(
        providerId: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<ReactRouterSignInReturn<Options>>
    signInCredentials: <Options extends ReactRouterSignInCredentialsAPIOptions>(
        options: Options
    ) => Promise<ReactRouterSignInCredentialsReturn<Options>>
    updateSession: <Options extends ReactRouterUpdateSessionAPIOptions<DefaultUser>>(
        options: Options
    ) => Promise<ReactRouterUpdateSessionReturn<Options, DefaultUser>>
    getProviderTokens: (oauth: LiteralUnion<BuiltInOAuthProvider>) => Promise<GetProviderTokensAPIReturn>
    getAccessToken: (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: AccessTokenAPIOptions) => Promise<AccessTokenAPIReturn>
    signOut: <Options extends ReactRouterSignOutAPIOptions>(options: Options) => Promise<ReactRouterSignOutReturn<Options>>
    signUp: <Options extends ReactRouterSignUpAPIOptions>(options: Options) => Promise<ReactRouterSignUpReturn<Options>>
    refreshUserInfo: <Options extends ReactRouterRefreshUserInfoAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ) => Promise<RefreshUserInfoAPIReturn<DefaultUser>>
    revokeToken: <Options extends ReactRouterRevokeTokenAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ) => Promise<RevokeTokenAPIReturn>
    disconnectProvider: <Options extends ReactRouterDisconnectProviderAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ) => Promise<DisconnectProviderAPIReturn>
    isProviderConnected: <Options extends ReactRouterProviderConnectedAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options: Options
    ) => Promise<ProviderConnectedAPIReturn>
}
