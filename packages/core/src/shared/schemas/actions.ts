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
} from "zod/v4"
import { RedirectOptionsSchema } from "@/shared/schemas/general.ts"
import type { OAuthProviderRecord } from "@/@types/internal.ts"

export const OAuthProviderListSchema = (oauth: OAuthProviderRecord) => {
    return object({
        oauth: enumeration(
            Object.keys(oauth) as (keyof OAuthProviderRecord)[],
            "The OAuth provider is not supported or invalid."
        ),
    })
}

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
    error: optional(ErrorActionResponseSchema),
})

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
