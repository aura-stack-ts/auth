/**
 * Next.js App Router integration types for the helpers returned by `createAuth` from `@aura-stack/next`.
 *
 * These conditional types describe return values when `redirect()` is used (which never returns in Next.js).
 */
import type { zod } from "@aura-stack/react/identity/zod"
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
    SchemaTypes,
    Wrap,
    RemoveIndexSignature,
    InferSchema,
    GetSessionAPIOptions,
    Session,
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
    ResolveAPIOptionsWithRedirect,
    GetProviderTokensAPIOptions,
    GetProviderTokensAPIReturn,
    AccessTokenAPIOptions,
    AccessTokenAPIReturn,
} from "@aura-stack/react/types"

/**
 * Return type for the Next.js server `api.signIn` helper (see `packages/next/src/lib/api.ts`).
 * When `Options` includes `redirect: true`, the helper calls `redirect()` and the type is `never` because execution does not continue.
 */
export type NextSignInReturn<Options extends SignInAPIOptions> = ResolveAPIOptionsWithRedirect<Options, SignInAPIReturn, never>

/**
 * Return type for the Next.js server `api.signInCredentials` helper.
 * Same `never` rule as {@link NextSignInReturn} when a server redirect is triggered via options.
 */
export type NextSignInCredentials<Options extends SignInCredentialsAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SignInCredentialsAPIReturn,
    never
>

export type NextUpdateSessionOptions<DefaultUser extends User = User> = Prettify<
    Omit<UpdateSessionAPIOptions<DefaultUser>, "headers"> & { headers?: HeadersInit }
>

/**
 * Return type for the Next.js server `api.updateSession` helper.
 */
export type NextUpdateSessionReturn<
    Options extends NextUpdateSessionOptions<DefaultUser>,
    DefaultUser extends User = User,
> = ResolveAPIOptionsWithRedirect<Options, UpdateSessionAPIReturn<DefaultUser>, never>

/**
 * Return type for the Next.js server `api.signOut` helper.
 * When `Options` includes a `redirectTo` string and the core API performs a redirect response, Next’s `redirect()` is invoked and the type is `never`.
 */
export type NextSignOutReturn<Options extends SignOutAPIOptions> = ResolveAPIOptionsWithRedirect<Options, SignOutAPIReturn, never>

/**
 * Return type for the Next.js server `api.signUp` helper.
 * Same `never` rule as {@link NextSignInReturn} when a server redirect is triggered via options.
 */
export type NextSignUpReturn<Options extends SignUpAPIOptions> = ResolveAPIOptionsWithRedirect<Options, SignUpAPIReturn, never>

export type NextSendVerificationEmailReturn<Options extends SendVerificationEmailAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SendVerificationEmailAPIReturn,
    never
>

export type NextVerifyEmailReturn<Options extends VerifyEmailAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    VerifyEmailAPIReturn,
    never
>

export type NextForgotPasswordReturn<Options extends ForgotPasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ForgotPasswordAPIReturn,
    never
>

export type NextResetPasswordReturn<Options extends ResetPasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ResetPasswordAPIReturn,
    never
>

export type NextChangePasswordReturn<Options extends ChangePasswordAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ChangePasswordAPIReturn,
    never
>

export type NextChangeEmailReturn<Options extends ChangeEmailAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    ChangeEmailAPIReturn,
    never
>

export type NextVerifyEmailChangeReturn<Options extends VerifyEmailChangeAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    VerifyEmailChangeAPIReturn,
    never
>

export type NextCancelEmailChangeReturn<Options extends CancelEmailChangeAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    CancelEmailChangeAPIReturn,
    never
>

export type NextSendMagicLinkReturn<Options extends SendMagicLinkAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    SendMagicLinkAPIReturn,
    never
>

export type NextVerifyMagicLinkReturn<Options extends VerifyMagicLinkAPIOptions> = ResolveAPIOptionsWithRedirect<
    Options,
    VerifyMagicLinkAPIReturn,
    never
>

export interface NextAPI<DefaultUser extends User = User, SignUpSchema extends SchemaTypes = zod.ZodObject<any>> {
    getSession: (options?: GetSessionAPIOptions) => Promise<Session<DefaultUser> | null>
    signIn: <Options extends SignInAPIOptions>(
        provider: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<NextSignInReturn<Options>>
    signInCredentials: <Options extends SignInCredentialsAPIOptions>(options: Options) => Promise<NextSignInCredentials<Options>>
    updateSession: <Options extends NextUpdateSessionOptions<DefaultUser>>(
        options: Options
    ) => Promise<NextUpdateSessionReturn<Options, DefaultUser>>
    getProviderTokens: (
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: GetProviderTokensAPIOptions
    ) => Promise<GetProviderTokensAPIReturn>
    getAccessToken: (oauth: LiteralUnion<BuiltInOAuthProvider>, options?: AccessTokenAPIOptions) => Promise<AccessTokenAPIReturn>
    signOut: <Options extends SignOutAPIOptions>(options?: Partial<Options>) => Promise<NextSignOutReturn<Options>>
    signUp: <Options extends SignUpAPIOptions<Wrap<RemoveIndexSignature<InferSchema<SignUpSchema>>>>>(
        options: Options
    ) => Promise<NextSignUpReturn<Options>>
    refreshUserInfo: <Options extends RefreshUserInfoAPIOptions>(
        oauth: LiteralUnion<BuiltInOAuthProvider>,
        options?: Options
    ) => Promise<RefreshUserInfoAPIReturn<DefaultUser>>
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
    sendVerificationEmail: <Options extends SendVerificationEmailAPIOptions = SendVerificationEmailAPIOptions>(
        email: string,
        options?: Options
    ) => Promise<NextSendVerificationEmailReturn<Options>>
    verifyEmail: <Options extends VerifyEmailAPIOptions = VerifyEmailAPIOptions>(
        token: string,
        options?: Options
    ) => Promise<NextVerifyEmailReturn<Options>>
    forgotPassword: <Options extends ForgotPasswordAPIOptions = ForgotPasswordAPIOptions>(
        email: string,
        options?: Options
    ) => Promise<NextForgotPasswordReturn<Options>>
    resetPassword: <Options extends ResetPasswordAPIOptions>(options: Options) => Promise<NextResetPasswordReturn<Options>>
    changePassword: <Options extends ChangePasswordAPIOptions>(options: Options) => Promise<NextChangePasswordReturn<Options>>
    changeEmail: <Options extends ChangeEmailAPIOptions>(options: Options) => Promise<NextChangeEmailReturn<Options>>
    verifyEmailChange: <Options extends VerifyEmailChangeAPIOptions>(
        options: Options
    ) => Promise<NextVerifyEmailChangeReturn<Options>>
    cancelEmailChange: <Options extends CancelEmailChangeAPIOptions>(
        options: Options
    ) => Promise<NextCancelEmailChangeReturn<Options>>
    sendMagicLink: <Options extends SendMagicLinkAPIOptions>(
        email: string,
        options?: Options
    ) => Promise<NextSendMagicLinkReturn<Options>>
    verifyMagicLink: <Options extends VerifyMagicLinkAPIOptions>(
        token: string,
        options?: Options
    ) => Promise<NextVerifyMagicLinkReturn<Options>>
}
