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
    SendVerificationEmailAPIOptions,
    SendVerificationEmailAPIReturn,
    VerifyEmailAPIOptions,
    VerifyEmailAPIReturn,
    ForgotPasswordAPIOptions,
    ForgotPasswordAPIReturn,
    ResetPasswordAPIOptions,
    ResetPasswordAPIReturn,
    ChangePasswordAPIOptions,
    ChangePasswordAPIReturn,
    ChangeEmailAPIOptions,
    ChangeEmailAPIReturn,
    VerifyEmailChangeAPIOptions,
    VerifyEmailChangeAPIReturn,
    CancelEmailChangeAPIOptions,
    CancelEmailChangeAPIReturn,
    SendMagicLinkAPIOptions,
    SendMagicLinkAPIReturn,
    VerifyMagicLinkAPIOptions,
    VerifyMagicLinkAPIReturn,
    SchemaTypes,
    Wrap,
    RemoveIndexSignature,
    InferSchema,
    ResolveAPIOptionsWithRedirect,
} from "@aura-stack/react/types"
import type { BuiltInOAuthProvider, LiteralUnion } from "@aura-stack/react/types"

type RequiredKeys<Options extends {}> = Prettify<Options & { request: Request }>

/** Core `signIn` options plus the incoming `Request` (required in React Router data APIs). */
export type ReactRouterSignInAPIOptions = RequiredKeys<SignInAPIOptions>

/**
 * Credentials sign-in options plus `request` and an optional `redirect` flag matching the server helper behavior.
 */
export type ReactRouterSignInCredentialsAPIOptions = RequiredKeys<SignInCredentialsAPIOptions>

/** Sign-out options plus the incoming `Request` for cookie and CSRF handling. */
export type ReactRouterSignOutAPIOptions = RequiredKeys<Partial<SignOutAPIOptions>>

export type ReactRouterSignOutReturn<Options extends ReactRouterSignOutAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SignOutAPIReturn,
    Response
>

/**
 * Result of the React Router `api.signIn` helper: the JSON API object when `redirect: false`,
 * otherwise the `Response` from `toResponse()` (redirect / navigation response).
 */
export type ReactRouterSignInReturn<Options extends ReactRouterSignInAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SignInAPIReturn,
    Response
>

/**
 * Result of the React Router `api.signInCredentials` helper: same discriminant.
 */
export type ReactRouterSignInCredentialsReturn<Options extends ReactRouterSignInCredentialsAPIOptions> =
    ResolveAPIOptionsWithRedirect<Options, SignInCredentialsAPIReturn, Response>

export type ReactRouterUpdateSessionAPIOptions<DefaultUser extends User = User> = Prettify<
    Partial<UpdateSessionAPIOptions<DefaultUser>> & { request: Request; session: UpdateSessionOptions<DefaultUser>["session"] }
>

export type ReactRouterUpdateSessionReturn<
    Options extends ReactRouterUpdateSessionAPIOptions<DefaultUser>,
    DefaultUser extends User = User,
> = ResolveAPIOptionsWithRedirect<Options, UpdateSessionAPIReturn<DefaultUser>, Response>

export type ReactRouterSignUpAPIOptions<Payload extends Record<string, any> = Record<string, any>> = RequiredKeys<
    SignUpAPIOptions<Payload>
>

export type ReactRouterSignUpReturn<Options extends ReactRouterSignUpAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SignUpAPIReturn,
    Response
>

export type ReactRouterRefreshUserInfoAPIOptions = RequiredKeys<RefreshUserInfoAPIOptions>

export type ReactRouterRevokeTokenAPIOptions = RequiredKeys<RevokeTokenAPIOptions>

export type ReactRouterDisconnectProviderAPIOptions = RequiredKeys<DisconnectProviderAPIOptions>

export type ReactRouterProviderConnectedAPIOptions = RequiredKeys<ProviderConnectedAPIOptions>

export type ReactRouterSendVerificationEmailAPIOptions = RequiredKeys<SendVerificationEmailAPIOptions>

export type ReactRouterSendVerificationEmailReturn<Options extends ReactRouterSendVerificationEmailAPIOptions> =
    ResolveAPIOptionsWithRedirect<Options, SendVerificationEmailAPIReturn, Response>

export type ReactRouterVerifyEmailAPIOptions = RequiredKeys<VerifyEmailAPIOptions>

export type ReactRouterVerifyEmailReturn<Options extends ReactRouterVerifyEmailAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    VerifyEmailAPIReturn,
    Response
>

export type ReactRouterForgotPasswordAPIOptions = RequiredKeys<ForgotPasswordAPIOptions>

export type ReactRouterForgotPasswordReturn<Options extends ReactRouterForgotPasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ForgotPasswordAPIReturn,
    Response
>

export type ReactRouterResetPasswordAPIOptions = RequiredKeys<ResetPasswordAPIOptions>

export type ReactRouterResetPasswordReturn<Options extends ReactRouterResetPasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ResetPasswordAPIReturn,
    Response
>

export type ReactRouterChangePasswordAPIOptions = RequiredKeys<ChangePasswordAPIOptions>

export type ReactRouterChangePasswordReturn<Options extends ReactRouterChangePasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ChangePasswordAPIReturn,
    Response
>

export type ReactRouterChangeEmailAPIOptions = RequiredKeys<ChangeEmailAPIOptions>

export type ReactRouterChangeEmailReturn<Options extends ReactRouterChangeEmailAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ChangeEmailAPIReturn,
    Response
>

export type ReactRouterVerifyEmailChangeAPIOptions = RequiredKeys<VerifyEmailChangeAPIOptions>

export type ReactRouterVerifyEmailChangeReturn<Options extends ReactRouterVerifyEmailChangeAPIOptions> =
    ResolveAPIOptionsWithRedirect<Options, VerifyEmailChangeAPIReturn, Response>

export type ReactRouterCancelEmailChangeAPIOptions = RequiredKeys<CancelEmailChangeAPIOptions>

export type ReactRouterCancelEmailChangeReturn<Options extends ReactRouterCancelEmailChangeAPIOptions> =
    ResolveAPIOptionsWithRedirect<Options, CancelEmailChangeAPIReturn, Response>

export type ReactRouterSendMagicLinkAPIOptions = RequiredKeys<SendMagicLinkAPIOptions>

export type ReactRouterSendMagicLinkReturn<Options extends ReactRouterSendMagicLinkAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SendMagicLinkAPIReturn,
    Response
>

export type ReactRouterVerifyMagicLinkAPIOptions = RequiredKeys<VerifyMagicLinkAPIOptions>

export type ReactRouterVerifyMagicLinkReturn<Options extends ReactRouterVerifyMagicLinkAPIOptions> =
    ResolveAPIOptionsWithRedirect<Options, VerifyMagicLinkAPIReturn, Response>

export interface ReactRouterAPI<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = SchemaTypes> {
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
    signUp: <Options extends ReactRouterSignUpAPIOptions<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>>(
        options: Options
    ) => Promise<ReactRouterSignUpReturn<Options>>
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
    sendVerificationEmail: <Options extends ReactRouterSendVerificationEmailAPIOptions>(
        email: string,
        options: Options
    ) => Promise<ReactRouterSendVerificationEmailReturn<Options>>
    verifyEmail: <Options extends ReactRouterVerifyEmailAPIOptions>(
        token: string,
        options: Options
    ) => Promise<ReactRouterVerifyEmailReturn<Options>>
    forgotPassword: <Options extends ReactRouterForgotPasswordAPIOptions>(
        email: string,
        options: Options
    ) => Promise<ReactRouterForgotPasswordReturn<Options>>
    resetPassword: <Options extends ReactRouterResetPasswordAPIOptions>(
        options: Options
    ) => Promise<ReactRouterResetPasswordReturn<Options>>
    changePassword: <Options extends ReactRouterChangePasswordAPIOptions>(
        options: Options
    ) => Promise<ReactRouterChangePasswordReturn<Options>>
    changeEmail: <Options extends ReactRouterChangeEmailAPIOptions>(
        options: Options
    ) => Promise<ReactRouterChangeEmailReturn<Options>>
    verifyEmailChange: <Options extends ReactRouterVerifyEmailChangeAPIOptions>(
        options: Options
    ) => Promise<ReactRouterVerifyEmailChangeReturn<Options>>
    cancelEmailChange: <Options extends ReactRouterCancelEmailChangeAPIOptions>(
        options: Options
    ) => Promise<ReactRouterCancelEmailChangeReturn<Options>>
    sendMagicLink: <Options extends ReactRouterSendMagicLinkAPIOptions>(
        email: string,
        options: Options
    ) => Promise<ReactRouterSendMagicLinkReturn<Options>>
    verifyMagicLink: <Options extends ReactRouterVerifyMagicLinkAPIOptions>(
        token: string,
        options: Options
    ) => Promise<ReactRouterVerifyMagicLinkReturn<Options>>
}
