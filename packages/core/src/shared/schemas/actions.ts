import {
    object,
    string,
    null as nullable,
    union,
    enum as enumeration,
    boolean,
    url,
    optional,
    number,
    array,
    literal,
    stringbool,
    email,
} from "zod/v4"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

export const OAuthProviderListSchema = (oauth: OAuthProviderRecord) => {
    return object({
        oauth: enumeration(
            Object.keys(oauth) as (keyof OAuthProviderRecord)[],
            "The OAuth provider is not supported or invalid."
        ),
    })
}

export const RedirectOptionsSchema = object({
    redirect: stringbool().optional().default(true),
    redirectTo: string().optional(),
})

export const ErrorActionResponseSchema = object({
    code: string(),
    message: string(),
})

export const OAuthTokenPayloadSchema = object({
    accessToken: string(),
    accessTokenExpiresAt: optional(number()),
    refreshToken: optional(string()),
    refreshTokenExpiresAt: optional(number()),
    idToken: optional(string()),
    tokenType: optional(string()),
    scopes: array(string()),
    issuer: optional(string()),
    issuedAt: number(),
    /**
     * @deprecated
     */
    expiresAt: optional(number()),
})

/**
 * @todo Add status code schema validation
 */
export const SignInActionResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    signInURL: union([url(), nullable()]),
})

export const SignInActionResponse500Schema = SignInActionResponseSchema.extend({
    error: optional(ErrorActionResponseSchema),
})

export const SignInActionResponseSchemas = {
    200: SignInActionResponseSchema,
    300: SignInActionResponseSchema,
    500: SignInActionResponse500Schema,
}

export const CSRFTokenActionResponseSchema = object({
    csrfToken: string(),
})

export const SearchParamsCallbackSchema = object({
    code: string("Missing code parameter in the OAuth authorization response."),
    state: string("Missing state parameter in the OAuth authorization response."),
})

export const RevokeTokenActionResponseSchema = object({
    success: boolean(),
})

export const GetProviderTokensActionResponseSchema = object({
    success: boolean(),
    tokens: union([OAuthTokenPayloadSchema, nullable()]),
})

export const RefreshUserInfoActionResponseSchema = object({
    success: boolean(),
    session: union([object({}), nullable()]),
})

export const IsProviderConnectedActionResponseSchema = object({
    success: boolean(),
    connected: boolean(),
})

export const DisconnectProviderActionResponseSchema = object({
    success: boolean(),
})

export const SignInCredentialsActionResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: union([url(), nullable()]),
})

export const SignOutSearchParamsSchema = RedirectOptionsSchema.extend({
    token_type_hint: literal("session_token"),
})

export const SignOutActionResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: union([url(), nullable()]),
})

export const SignUpActionResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: union([url(), nullable()]),
})

export const VerifyEmailActionResponseSchema = object({
    success: boolean(),
    verified: boolean(),
    redirect: boolean(),
    redirectURL: union([url(), nullable()]),
})

export const VerifyEmailSearchParamsSchema = RedirectOptionsSchema.extend({
    token: string().min(32),
})

export const ForgotPasswordBodySchema = object({
    email: email(),
})

export const ForgotPasswordResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: string().nullable(),
})

export const ResetPasswordBodySchema = object({
    token: string().min(32),
    newPassword: string().min(1),
})

export const ResetPasswordResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: string().nullable(),
})

export const ChangePasswordBodySchema = object({
    currentPassword: string().min(1),
    newPassword: string().min(1),
})

export const ChangePasswordResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: string().nullable(),
})

export const ChangeEmailBodySchema = object({
    currentPassword: string().min(1),
    newEmail: email(),
})

export const ChangeEmailResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: string().nullable(),
})

export const VerifyEmailChangeSearchParamsSchema = RedirectOptionsSchema.extend({
    token: string().min(32),
})

export const VerifyEmailChangeResponseSchema = object({
    success: boolean(),
    redirect: boolean(),
    redirectURL: string().nullable(),
})
