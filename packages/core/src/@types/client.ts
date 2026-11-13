import type { Session, User } from "@/@types/session.ts"
import type { createAuthInstance } from "@/config/router.ts"
import type { ClientOptions, Prettify } from "@aura-stack/router/types"
import type { CredentialsPayload, DeepPartial } from "@/@types/index.ts"
import type {
    CancelEmailChangeData,
    ChangeEmailData,
    ChangePasswordData,
    ForgotPasswordData,
    GetProviderTokensData,
    ResetPasswordData,
    SendMagicLinkData,
    SendVerificationEmailData,
    SignInCredentialsReturnData,
    SignInReturnData,
    SignOutReturnData,
    SignUpReturnData,
    UpdateSessionReturnData,
    VerifyEmailChangeData,
    VerifyEmailData,
    VerifyMagicLinkData,
} from "@/@types/api.ts"

/**
 * HTTP route handlers exposed by the auth instance (`GET`, `POST`, `PATCH`, `ALL`) for mounting on your app router.
 */
export type AuthClient = ReturnType<typeof createAuthInstance>["handlers"]

/**
 * Options for {@link createAuthClient} (browser HTTP client). Extends the router client with an optional `baseURL`
 * when the client runs outside the browser (e.g. server-side fetch to your app origin).
 */
export type AuthClientOptions = Prettify<
    Omit<ClientOptions, "baseURL"> & {
        /**
         * The base URL of the application
         *
         * @example
         * baseURL: "https://app.com"
         */
        baseURL?: string
        /**
         * List of trusted origins allowed for redirection to prevent open redirect attacks.
         * Use this option when your application redirects users to external domains.
         *
         * @remarks
         * By default, the origin of the `baseURL` option is automatically trusted.
         *
         * @example
         * trustedOrigins: ["https://adminapp.com", "https://bankapp.com"]
         */
        trustedOrigins?: string[]
        /**
         * Global fallback redirect destination used when a target redirect URL is untrusted or invalid.
         * Can be overridden per call via `createAuthClient` methods using the `fallbackRedirectTo` option.
         *
         * @default "/"
         * @example
         * fallbackRedirectTo: "/home"
         */
        fallbackRedirectTo?: string
    }
>

export type ResolveOptionsWithRedirect<
    Options extends OptionsWithRedirectTo,
    ReturnData extends { redirect: boolean },
> = Options extends { redirect: false }
    ? Extract<ReturnData, { redirect: false }>
    : Options extends { redirectTo: any }
      ? void
      : Extract<ReturnData, { redirect: false }>

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
    /**
     * Fallback redirect destination used when a target redirect URL is untrusted or invalid.
     * Overrides the global `fallbackRedirectTo` option configured in `createAuth`.
     *
     * @default "/"
     * @example
     * fallbackRedirectTo: "/dashboard"
     */
    fallbackRedirectTo?: string
}

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
export type SignInReturn<Options extends SignInOptions> = ResolveOptionsWithRedirect<Options, SignInReturnData>

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
export type SignInCredentialsReturn<Options extends SignInCredentialsOptions> = ResolveOptionsWithRedirect<
    Options,
    SignInCredentialsReturnData
>

/** Client-side sign-out options. */
export interface SignOutOptions extends OptionsWithRedirectTo {}

/** Client-side sign-out return type (redirect mode or manual redirect data). */
export type SignOutReturn<Options extends SignOutOptions> = ResolveOptionsWithRedirect<Options, SignOutReturnData>

/** Client-side `updateSession` options: partial session payload plus optional redirect behavior. */
export interface UpdateSessionOptions<DefaultUser extends User = User> extends OptionsWithRedirectTo {
    /** Partial session data to merge into the current session. */
    session: DeepPartial<Session<DefaultUser>>
}

/** Client-side `updateSession` return type. */
export type UpdateSessionReturn<
    Options extends UpdateSessionOptions<DefaultUser>,
    DefaultUser extends User = User,
> = Options extends {
    redirect: false
}
    ? Extract<UpdateSessionReturnData<DefaultUser>, { redirect: false }>
    : Options extends { redirectTo: any }
      ? void
      : Extract<UpdateSessionReturnData<DefaultUser>, { redirect: false }>

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
export type SignUpReturn<Options extends SignUpOptions> = ResolveOptionsWithRedirect<Options, SignUpReturnData>

/**
 * Client-side `getProviderTokens` return type.
 */
export type GetProviderTokensReturn = GetProviderTokensData

/** Client-side options for `sendVerificationEmail` API. */
export type SendVerificationEmailOptions = OptionsWithRedirectTo

/** Client-side return type for `sendVerificationEmail` API. */
export type SendVerificationEmailReturn<Options extends SendVerificationEmailOptions> = ResolveOptionsWithRedirect<
    Options,
    SendVerificationEmailData
>

/** Client-side options for `verifyEmail` API. */
export type VerifyEmailOptions = OptionsWithRedirectTo

/** Client-side return type for `verifyEmail` API. */
export type VerifyEmailReturn<Options extends VerifyEmailOptions> = ResolveOptionsWithRedirect<Options, VerifyEmailData>

/** Client-side options for `forgotPassword` API. */
export type ForgotPasswordOptions = OptionsWithRedirectTo

/** Client-side return type for `forgotPassword` API. */
export type ForgotPasswordReturn<Options extends ForgotPasswordOptions> = ResolveOptionsWithRedirect<Options, ForgotPasswordData>

/** Client-side options for `resetPassword` API. */
export type ResetPasswordOptions = OptionsWithRedirectTo & {
    payload: {
        token: string
        newPassword: string
    }
}
/** Client-side return type for `resetPassword` API. */
export type ResetPasswordReturn<Options extends ResetPasswordOptions> = ResolveOptionsWithRedirect<Options, ResetPasswordData>

/** Client-side options for `changePassword` API. */
export type ChangePasswordOptions = OptionsWithRedirectTo & {
    payload: {
        currentPassword: string
        newPassword: string
    }
}

/** Client-side return type for `changePassword` API. */
export type ChangePasswordReturn<Options extends ChangePasswordOptions> = ResolveOptionsWithRedirect<Options, ChangePasswordData>

/** Client-side options for `changeEmail` API. */
export type ChangeEmailOptions = OptionsWithRedirectTo & {
    payload: {
        currentPassword: string
        newEmail: string
    }
}

/** Client-side return type for `changeEmail` API. */
export type ChangeEmailReturn<Options extends ChangeEmailOptions> = ResolveOptionsWithRedirect<Options, ChangeEmailData>

/** Client-side options for `verifyEmailChange` API. */
export type VerifyEmailChangeOptions = OptionsWithRedirectTo & {
    payload: {
        token: string
    }
}

/** Client-side return type for `verifyEmailChange` API. */
export type VerifyEmailChangeReturn<Options extends VerifyEmailChangeOptions> = ResolveOptionsWithRedirect<
    Options,
    VerifyEmailChangeData
>

/** Client-side options for `cancelEmailChange` API. */
export type CancelEmailChangeOptions = OptionsWithRedirectTo & {
    payload?: {
        token: string
    }
}

/** Client-side return type for `cancelEmailChange` API. */
export type CancelEmailChangeReturn<Options extends CancelEmailChangeOptions> = ResolveOptionsWithRedirect<
    Options,
    CancelEmailChangeData
>

/** Client-side options for `sendMagicLink` API. */
export type SendMagicLinkOptions = OptionsWithRedirectTo

/** Client-side return type for `sendMagicLink` API. */
export type SendMagicLinkReturn<Options extends SendMagicLinkOptions> = ResolveOptionsWithRedirect<Options, SendMagicLinkData>

/** Client-side options for `verifyMagicLink` API. */
export type VerifyMagicLinkOptions = OptionsWithRedirectTo

/** Client-side return type for `verifyMagicLink` API. */
export type VerifyMagicLinkReturn<Options extends VerifyMagicLinkOptions> = ResolveOptionsWithRedirect<
    Options,
    VerifyMagicLinkData
>
