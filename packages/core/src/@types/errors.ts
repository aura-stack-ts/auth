import { z } from "zod/v4"
import { OAuthAccessTokenErrorResponse, OAuthAuthorizationErrorResponse } from "@/schemas.ts"

/** Map of field or logical keys to API validation error payloads (code + message). */
export type APIErrorMap = Record<string, { code: string; message: string }>

/**
 * Base OAuth error response structure.
 */
export interface OAuthError<T extends string> {
    error: T
    error_description?: string
}

/**
 * OAuth 2.0 Authorization Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
 */
export type AuthorizationError = OAuthError<z.infer<typeof OAuthAuthorizationErrorResponse>["error"]>

/**
 * OAuth 2.0 Access Token Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export type AccessTokenError = OAuthError<z.infer<typeof OAuthAccessTokenErrorResponse>["error"]>

/**
 * OAuth 2.0 Token Revocation Error Response Types
 * @see https://datatracker.ietf.org/doc/html/rfc7009#section-2.2.1
 */
export type TokenRevocationError = OAuthError<"invalid_session_token">

/** Union of all OAuth-related `error` string values exposed by this package. */
export type ErrorType = AuthorizationError["error"] | AccessTokenError["error"] | TokenRevocationError["error"]

/**
 * Machine-readable codes for internal auth failures (configuration, crypto, environment, etc.).
 * Used with {@link AuthInternalError} and logging.
 */
export type AuthInternalErrorCode =
    | "INVALID_OAUTH_CONFIGURATION"
    | "INVALID_JWT_TOKEN"
    | "JOSE_INITIALIZATION_FAILED"
    | "SESSION_STORE_NOT_INITIALIZED"
    | "COOKIE_STORE_NOT_INITIALIZED"
    | "COOKIE_PARSING_FAILED"
    | "COOKIE_NOT_FOUND"
    | "INVALID_ENVIRONMENT_CONFIGURATION"
    | "INVALID_URL"
    | "INVALID_SALT_SECRET_VALUE"
    | "UNTRUSTED_ORIGIN"
    | "INVALID_OAUTH_PROVIDER_CONFIGURATION"
    | "DUPLICATED_OAUTH_PROVIDER_ID"
    | "CREDENTIALS_PROVIDER_NOT_CONFIGURED"
    | "IDENTITY_VALIDATION_FAILED"

/**
 * Machine-readable codes for security-sensitive failures (CSRF, session, open redirect, OAuth state).
 */
export type AuthSecurityErrorCode =
    | "INVALID_STATE"
    | "MISMATCHING_STATE"
    | "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED"
    | "CSRF_TOKEN_INVALID"
    | "CSRF_TOKEN_MISSING"
    | "SESSION_TOKEN_MISSING"
