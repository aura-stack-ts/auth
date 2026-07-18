import { getEnv, getEnvBoolean } from "@/shared/env.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"
import type { AuthConfig, InternalLogger, Logger, LogLevel, SyslogOptions } from "@/@types/index.ts"

/**
 * Log message definitions organized by category.
 * Each message includes facility, severity, msgId, and default message.
 */
export const logMessages = {
    ROUTER_INTERNAL_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "ROUTER_INTERNAL_ERROR",
        message: "Unhandled router error while processing the request",
    },
    INVALID_REQUEST: {
        facility: 10,
        severity: "warning",
        msgId: "INVALID_REQUEST",
        message: "Request validation failed against the expected schema",
    },
    SERVER_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "SERVER_ERROR",
        message: "Unexpected internal server error during authentication",
    },
    OAUTH_PROTOCOL_ERROR: {
        facility: 10,
        severity: "warning",
        msgId: "OAUTH_PROTOCOL_ERROR",
        message: "OAuth provider returned an invalid or unexpected protocol response",
    },
    OAUTH_AUTHORIZATION_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_AUTHORIZATION_ERROR",
        message: "OAuth authorization request was rejected or failed",
    },
    INVALID_OAUTH_CONFIGURATION: {
        facility: 10,
        severity: "error",
        msgId: "INVALID_OAUTH_CONFIGURATION",
        message: "The OAuth provider configuration is invalid or incomplete",
    },
    OAUTH_ACCESS_TOKEN_REQUEST_INITIATED: {
        facility: 10,
        severity: "debug",
        msgId: "OAUTH_ACCESS_TOKEN_REQUEST_INITIATED",
        message: "Starting OAuth access token request to the provider",
    },
    INVALID_OAUTH_ACCESS_TOKEN_RESPONSE: {
        facility: 10,
        severity: "error",
        msgId: "INVALID_OAUTH_ACCESS_TOKEN_RESPONSE",
        message: "OAuth access token endpoint returned an invalid or malformed response",
    },
    OAUTH_ACCESS_TOKEN_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_ACCESS_TOKEN_ERROR",
        message: "OAuth access token endpoint returned an error response",
    },
    OAUTH_ACCESS_TOKEN_SUCCESS: {
        facility: 10,
        severity: "info",
        msgId: "OAUTH_ACCESS_TOKEN_SUCCESS",
        message: "Successfully retrieved OAuth access token from the provider",
    },
    OAUTH_ACCESS_TOKEN_REQUEST_FAILED: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_ACCESS_TOKEN_REQUEST_FAILED",
        message: "Network or server error while requesting OAuth access token",
    },
    OAUTH_USERINFO_REQUEST_INITIATED: {
        facility: 10,
        severity: "debug",
        msgId: "OAUTH_USERINFO_REQUEST_INITIATED",
        message: "Starting OAuth userinfo request to the provider",
    },
    OAUTH_USERINFO_INVALID_RESPONSE: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_USERINFO_INVALID_RESPONSE",
        message: "OAuth userinfo endpoint returned an invalid or malformed response",
    },
    OAUTH_USERINFO_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_USERINFO_ERROR",
        message: "OAuth userinfo endpoint returned an error response",
    },
    OAUTH_USERINFO_SUCCESS: {
        facility: 10,
        severity: "info",
        msgId: "OAUTH_USERINFO_SUCCESS",
        message: "Successfully retrieved user information from the OAuth provider",
    },
    OAUTH_USERINFO_REQUEST_FAILED: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_USERINFO_REQUEST_FAILED",
        message: "Network or server error while requesting user information from the OAuth provider",
    },
    OAUTH_CALLBACK_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "OAUTH_CALLBACK_SUCCESS",
        message: "OAuth callback completed successfully and session was created",
    },
    MISMATCHING_STATE: {
        facility: 4,
        severity: "critical",
        msgId: "MISMATCHING_STATE",
        message: "OAuth response state parameter does not match the stored state value",
    },
    POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED: {
        facility: 4,
        severity: "critical",
        msgId: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED",
        message: "Blocked redirect to untrusted or external URL (potential open redirect attack)",
    },
    OPEN_REDIRECT_ATTACK: {
        facility: 4,
        severity: "warning",
        msgId: "OPEN_REDIRECT_ATTACK",
        message: "Detected redirect target that does not match the trusted origin",
    },
    SESSION_TOKEN_MISSING: {
        facility: 4,
        severity: "warning",
        msgId: "SESSION_TOKEN_MISSING",
        message: "Session cookie is missing from the request",
    },
    CSRF_TOKEN_MISSING: {
        facility: 4,
        severity: "warning",
        msgId: "CSRF_TOKEN_MISSING",
        message: "CSRF token cookie is missing from the request",
    },
    CSRF_HEADER_MISSING: {
        facility: 4,
        severity: "warning",
        msgId: "CSRF_HEADER_MISSING",
        message: "CSRF header is missing from the request",
    },
    CSRF_TOKEN_INVALID: {
        facility: 4,
        severity: "error",
        msgId: "CSRF_TOKEN_INVALID",
        message: "CSRF token verification failed or token is invalid",
    },
    SIGN_IN_INITIATED: {
        facility: 4,
        severity: "info",
        msgId: "SIGN_IN_INITIATED",
        message: "Starting OAuth sign-in flow for the selected provider",
    },
    SIGN_OUT_ATTEMPT: {
        facility: 4,
        severity: "debug",
        msgId: "SIGN_OUT_ATTEMPT",
        message: "Received sign-out request from client",
    },
    SIGN_OUT_CSRF_VERIFIED: {
        facility: 4,
        severity: "info",
        msgId: "SIGN_OUT_CSRF_VERIFIED",
        message: "CSRF token was successfully verified during sign-out",
    },
    SIGN_OUT_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "SIGN_OUT_SUCCESS",
        message: "User session was cleared and sign-out completed successfully",
    },
    SIGN_OUT_REDIRECT: {
        facility: 4,
        severity: "debug",
        msgId: "SIGN_OUT_REDIRECT",
        message: "Redirecting client after successful sign-out",
    },
    AUTH_SESSION_VALID: {
        facility: 4,
        severity: "info",
        msgId: "AUTH_SESSION_VALID",
        message: "Session token is valid and user session was returned",
    },
    AUTH_SESSION_INVALID: {
        facility: 4,
        severity: "notice",
        msgId: "AUTH_SESSION_INVALID",
        message: "Session token is missing, expired, or invalid",
    },
    INVALID_JWT_TOKEN: {
        facility: 4,
        severity: "warning",
        msgId: "INVALID_JWT_TOKEN",
        message: "JWT session token failed validation during sign-out",
    },
    CSRF_TOKEN_REQUESTED: {
        facility: 4,
        severity: "debug",
        msgId: "CSRF_TOKEN_REQUESTED",
        message: "Client requested a CSRF token",
    },
    CSRF_TOKEN_ISSUED: {
        facility: 4,
        severity: "debug",
        msgId: "CSRF_TOKEN_ISSUED",
        message: "Issued a new CSRF token to the client",
    },
    INVALID_URL: {
        facility: 10,
        severity: "error",
        msgId: "INVALID_URL",
        message: "Derived origin URL is invalid or malformed",
    },
    COOKIE_HTTPONLY_DISABLED: {
        facility: 10,
        severity: "critical",
        msgId: "COOKIE_HTTPONLY_DISABLED",
        message:
            "Cookie is configured without HttpOnly. This allows JavaScript access via document.cookie and increases XSS exposure.",
    },
    COOKIE_WILDCARD_DOMAIN: {
        facility: 10,
        severity: "critical",
        msgId: "COOKIE_WILDCARD_DOMAIN",
        message: "Cookie 'Domain' is set to a wildcard, which is insecure and should be avoided.",
    },
    COOKIE_SECURE_DISABLED: {
        facility: 10,
        severity: "warning",
        msgId: "COOKIE_SECURE_DISABLED",
        message:
            "Cookie is configured with 'Secure' but the request is not HTTPS. The 'Secure' attribute will be ignored by the browser.",
    },
    COOKIE_SAMESITE_NONE_WITHOUT_SECURE: {
        facility: 10,
        severity: "warning",
        msgId: "COOKIE_SAMESITE_NONE_WITHOUT_SECURE",
        message: "Cookie uses SameSite=None without Secure. Falling back to SameSite=Lax for safer defaults.",
    },
    COOKIE_INSECURE_IN_PRODUCTION: {
        facility: 10,
        severity: "critical",
        msgId: "COOKIE_INSECURE_IN_PRODUCTION",
        message: "Cookies are being served over an insecure connection in production, which is a serious security risk.",
    },
    COOKIE_HOST_STRATEGY_INSECURE: {
        facility: 10,
        severity: "critical",
        msgId: "COOKIE_HOST_STRATEGY_INSECURE",
        message: "__Host- cookies require a secure HTTPS context. Falling back to standard cookie settings.",
    },
    UNTRUSTED_ORIGIN: {
        facility: 10,
        severity: "error",
        msgId: "UNTRUSTED_ORIGIN",
        message: "The constructed origin URL is not trusted.",
    },
    SESSION_REFRESHED: {
        facility: 4,
        severity: "info",
        msgId: "SESSION_REFRESHED",
        message: "User session was refreshed with a new expiration time",
    },
    AUTH_SECURITY_ERROR: {
        facility: 10,
        severity: "error",
        msgId: "AUTH_SECURITY_ERROR",
        message: "An authentication security error occurred",
    },
    CSRF_TOKEN_VERIFIED: {
        facility: 4,
        severity: "info",
        msgId: "CSRF_TOKEN_VERIFIED",
        message: "CSRF token verification succeeded",
    },
    IDENTITY_VALIDATION_DISABLED: {
        facility: 4,
        severity: "warning",
        msgId: "IDENTITY_VALIDATION_DISABLED",
        message: "Identity validation is disabled. User data will not be validated against a schema.",
    },
    IDENTITY_VALIDATION_FAILED: {
        facility: 4,
        severity: "error",
        msgId: "IDENTITY_VALIDATION_FAILED",
        message: "User identity validation against the schema failed",
    },
    CREDENTIALS_SIGN_IN_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "CREDENTIALS_SIGN_IN_SUCCESS",
        message: "User successfully authenticated with credentials",
    },
    INVALID_CREDENTIALS: {
        facility: 4,
        severity: "warning",
        msgId: "INVALID_CREDENTIALS",
        message: "Authentication failed due to invalid credentials",
    },
    CREDENTIALS_SIGN_IN_FAILED: {
        facility: 4,
        severity: "error",
        msgId: "CREDENTIALS_SIGN_IN_FAILED",
        message: "An error occurred during credentials sign-in",
    },
    SIGN_UP_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "SIGN_UP_SUCCESS",
        message: "User successfully signed up and authenticated",
    },
    SESSION_NOT_FOUND: {
        facility: 4,
        severity: "error",
        msgId: "SESSION_NOT_FOUND",
        message: "Session token was not found in the request cookies",
    },
    OAUTH_INVALID_CONTENT_TYPE: {
        facility: 10,
        severity: "error",
        msgId: "OAUTH_INVALID_CONTENT_TYPE",
        message: "OAuth endpoint returned an invalid Content-Type header",
    },
    SIGN_IN_PROVIDER_TYPE_DETECTED: {
        facility: 4,
        severity: "info",
        msgId: "SIGN_IN_PROVIDER_TYPE_DETECTED",
        message: "Detected OAuth provider type (OIDC or standard)",
    },
    OIDC_PROVIDER_RESOLVED: {
        facility: 4,
        severity: "info",
        msgId: "OIDC_PROVIDER_RESOLVED",
        message: "OIDC provider configuration resolved successfully",
    },
    STATEFUL_GET_SESSION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_SESSION_START",
        message: "Starting stateful session retrieval process",
    },
    STATEFUL_SESSION_TOKEN_EXTRACTED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_TOKEN_EXTRACTED",
        message: "Session token extracted from request cookies",
    },
    STATEFUL_SESSION_TOKEN_MISSING: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_TOKEN_MISSING",
        message: "Session token is missing from request cookies",
    },
    STATEFUL_SESSION_DB_LOOKUP: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_DB_LOOKUP",
        message: "Looking up session in database by token hash",
    },
    STATEFUL_SESSION_NOT_FOUND: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_NOT_FOUND",
        message: "Session not found in database",
    },
    STATEFUL_SESSION_NO_USER: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_NO_USER",
        message: "Session exists but has no associated user",
    },
    STATEFUL_SESSION_STATUS_CHECK: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_STATUS_CHECK",
        message: "Checking session status and expiration",
    },
    STATEFUL_SESSION_INACTIVE: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_INACTIVE",
        message: "Session is not active",
    },
    STATEFUL_SESSION_EXPIRED: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_EXPIRED",
        message: "Session has expired",
    },
    STATEFUL_USER_DATA_MERGED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_USER_DATA_MERGED",
        message: "Merged user data with user attributes",
    },
    STATEFUL_USER_VALIDATION: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_USER_VALIDATION",
        message: "Validating user data against identity schema",
    },
    STATEFUL_GET_SESSION_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_GET_SESSION_SUCCESS",
        message: "Stateful session retrieved successfully",
    },
    STATEFUL_GET_SESSION_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_GET_SESSION_ERROR",
        message: "Error occurred during stateful session retrieval",
    },
    STATEFUL_CREATE_SESSION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_CREATE_SESSION_START",
        message: "Starting stateful session creation process",
    },
    STATEFUL_PAYLOAD_VALIDATION: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_PAYLOAD_VALIDATION",
        message: "Validating session payload against identity schema",
    },
    STATEFUL_CREATE_SESSION_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_CREATE_SESSION_ERROR",
        message: "Error occurred during stateful session creation",
    },
    STATEFUL_TOKEN_GENERATED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_TOKEN_GENERATED",
        message: "Generated new session token",
    },
    STATEFUL_TOKEN_HASHED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_TOKEN_HASHED",
        message: "Hashed session token for database storage",
    },
    STATEFUL_SESSION_EXPIRATION_SET: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_EXPIRATION_SET",
        message: "Set session expiration time",
    },
    STATEFUL_SESSION_CREATED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_SESSION_CREATED",
        message: "Session created in database",
    },
    STATEFUL_CREATE_SESSION_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_CREATE_SESSION_SUCCESS",
        message: "Stateful session created successfully",
    },
    STATEFUL_REFRESH_SESSION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_REFRESH_SESSION_START",
        message: "Starting stateful session refresh process",
    },
    STATEFUL_REFRESH_TOKEN_MISSING: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_REFRESH_TOKEN_MISSING",
        message: "Session token missing during refresh",
    },
    STATEFUL_CSRF_VERIFICATION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_CSRF_VERIFICATION_START",
        message: "Starting CSRF token verification",
    },
    STATEFUL_CSRF_VERIFICATION_RESULT: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_CSRF_VERIFICATION_RESULT",
        message: "CSRF token verification completed",
    },
    STATEFUL_CSRF_VERIFICATION_FAILED: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_CSRF_VERIFICATION_FAILED",
        message: "CSRF token verification failed",
    },
    STATEFUL_REFRESH_SESSION_NOT_FOUND: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_REFRESH_SESSION_NOT_FOUND",
        message: "Session not found during refresh",
    },
    STATEFUL_SESSION_EXPIRATION_CHECK: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_EXPIRATION_CHECK",
        message: "Checking session expiration during refresh",
    },
    STATEFUL_EXPIRED_SESSION_REVOKED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_EXPIRED_SESSION_REVOKED",
        message: "Expired session was revoked",
    },
    STATEFUL_SESSION_EXPIRATION_UPDATE: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_EXPIRATION_UPDATE",
        message: "Updating session expiration time",
    },
    STATEFUL_SESSION_UPDATED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_UPDATED",
        message: "Session updated in database",
    },
    STATEFUL_SESSION_TOUCHED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_TOUCHED",
        message: "Session last activity timestamp updated",
    },
    STATEFUL_REFRESH_SESSION_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_REFRESH_SESSION_SUCCESS",
        message: "Stateful session refreshed successfully",
    },
    STATEFUL_REFRESH_SESSION_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_REFRESH_SESSION_ERROR",
        message: "Error occurred during stateful session refresh",
    },
    STATEFUL_REVOKE_SESSION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_REVOKE_SESSION_START",
        message: "Starting stateful session revocation",
    },
    STATEFUL_REVOKE_SESSION_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_REVOKE_SESSION_ERROR",
        message: "Error occurred during stateful session revocation",
    },
    STATEFUL_REVOKE_SESSION_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_REVOKE_SESSION_SUCCESS",
        message: "Stateful session revoked successfully",
    },
    STATEFUL_DESTROY_SESSION_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_DESTROY_SESSION_START",
        message: "Starting stateful session destruction",
    },
    STATEFUL_SESSION_REVOKED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_SESSION_REVOKED",
        message: "Session revoked during destruction",
    },
    STATEFUL_SESSION_NOT_FOUND_FOR_DESTRUCTION: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_SESSION_NOT_FOUND_FOR_DESTRUCTION",
        message: "Session not found during destruction",
    },
    STATEFUL_NO_TOKEN_FOR_DESTRUCTION: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_NO_TOKEN_FOR_DESTRUCTION",
        message: "No session token found during destruction",
    },
    STATEFUL_DESTROY_SESSION_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_DESTROY_SESSION_ERROR",
        message: "Error occurred during stateful session destruction",
    },
    STATEFUL_DESTROY_SESSION_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_DESTROY_SESSION_SUCCESS",
        message: "Stateful session destroyed successfully",
    },
    STATEFUL_SESSION_UPDATE_PAYLOAD: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_SESSION_UPDATE_PAYLOAD",
        message: "Session update payload received and parsed",
    },
    STATEFUL_USER_FIELDS_MERGED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_USER_FIELDS_MERGED",
        message: "User fields merged with update payload",
    },
    STATEFUL_UPDATED_USER_VALIDATED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_UPDATED_USER_VALIDATED",
        message: "Updated user data validated against schema",
    },
    STATEFUL_USER_UPDATED_IN_DB: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_USER_UPDATED_IN_DB",
        message: "User updated in database with new fields",
    },
    STATEFUL_USER_NOT_FOUND_CREATING: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_USER_NOT_FOUND_CREATING",
        message: "User not found, creating new user",
    },
    STATEFUL_USER_CREATED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_USER_CREATED",
        message: "User created in database",
    },
    STATEFUL_USER_FOUND_UPDATING: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_USER_FOUND_UPDATING",
        message: "User found, updating existing user",
    },
    STATEFUL_USER_UPDATED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_USER_UPDATED",
        message: "User updated in database",
    },
    STATEFUL_GET_PROVIDER_TOKENS_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_START",
        message: "Starting stateful getProviderTokens process",
    },
    STATEFUL_GET_PROVIDER_TOKENS_NO_SESSION: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_NO_SESSION",
        message: "No session token found during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_SESSION_INVALID: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_SESSION_INVALID",
        message: "Session invalid or has no user during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_SESSION_FOUND: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_SESSION_FOUND",
        message: "Session found and validated during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_NOT_FOUND: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_NOT_FOUND",
        message: "OAuth account not found during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_FOUND: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_FOUND",
        message: "OAuth account found during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_TOKENS_EXTRACTED: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_TOKENS_EXTRACTED",
        message: "OAuth tokens extracted from database",
    },
    STATEFUL_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND: {
        facility: 4,
        severity: "warning",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND",
        message: "OAuth provider not configured during getProviderTokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_REFRESH_CHECK: {
        facility: 4,
        severity: "debug",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_REFRESH_CHECK",
        message: "Checking if OAuth tokens need refresh",
    },
    STATEFUL_GET_PROVIDER_TOKENS_REFRESHING: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_REFRESHING",
        message: "Refreshing OAuth tokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_REFRESH_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_REFRESH_SUCCESS",
        message: "OAuth tokens refreshed successfully",
    },
    STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_UPDATED: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_OAUTH_ACCOUNT_UPDATED",
        message: "OAuth account updated with refreshed tokens",
    },
    STATEFUL_GET_PROVIDER_TOKENS_REFRESH_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_REFRESH_ERROR",
        message: "Error occurred during OAuth token refresh",
    },
    STATEFUL_GET_PROVIDER_TOKENS_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_SUCCESS",
        message: "Stateful getProviderTokens completed successfully",
    },
    STATEFUL_GET_PROVIDER_TOKENS_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATEFUL_GET_PROVIDER_TOKENS_ERROR",
        message: "Error occurred during stateful getProviderTokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_START: {
        facility: 4,
        severity: "debug",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_START",
        message: "Starting stateless getProviderTokens process",
    },
    STATELESS_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND: {
        facility: 4,
        severity: "warning",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_PROVIDER_NOT_FOUND",
        message: "OAuth provider not configured during stateless getProviderTokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_PROVIDER_FOUND: {
        facility: 4,
        severity: "debug",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_PROVIDER_FOUND",
        message: "OAuth provider found during stateless getProviderTokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_NO_COOKIE: {
        facility: 4,
        severity: "warning",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_NO_COOKIE",
        message: "No access token cookie found during stateless getProviderTokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_COOKIE_FOUND: {
        facility: 4,
        severity: "debug",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_COOKIE_FOUND",
        message: "Access token cookie found during stateless getProviderTokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_TOKENS_DECODED: {
        facility: 4,
        severity: "debug",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_TOKENS_DECODED",
        message: "OAuth tokens decoded from cookie",
    },
    STATELESS_GET_PROVIDER_TOKENS_REFRESH_CHECK: {
        facility: 4,
        severity: "debug",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_REFRESH_CHECK",
        message: "Checking if OAuth tokens need refresh (stateless)",
    },
    STATELESS_GET_PROVIDER_TOKENS_REFRESHING: {
        facility: 4,
        severity: "info",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_REFRESHING",
        message: "Refreshing OAuth tokens (stateless)",
    },
    STATELESS_GET_PROVIDER_TOKENS_REFRESH_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_REFRESH_SUCCESS",
        message: "OAuth tokens refreshed successfully (stateless)",
    },
    STATELESS_GET_PROVIDER_TOKENS_COOKIE_UPDATED: {
        facility: 4,
        severity: "info",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_COOKIE_UPDATED",
        message: "Access token cookie updated with refreshed tokens",
    },
    STATELESS_GET_PROVIDER_TOKENS_REFRESH_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_REFRESH_ERROR",
        message: "Error occurred during OAuth token refresh (stateless)",
    },
    STATELESS_GET_PROVIDER_TOKENS_SUCCESS: {
        facility: 4,
        severity: "info",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_SUCCESS",
        message: "Stateless getProviderTokens completed successfully",
    },
    STATELESS_GET_PROVIDER_TOKENS_ERROR: {
        facility: 4,
        severity: "error",
        msgId: "STATELESS_GET_PROVIDER_TOKENS_ERROR",
        message: "Error occurred during stateless getProviderTokens",
    },
} as const

export const createLogEntry = <T extends keyof typeof logMessages>(key: T, overrides?: Partial<SyslogOptions>): SyslogOptions => {
    const message = logMessages[key]
    return {
        ...message,
        timestamp: new Date().toISOString(),
        hostname: "aura-auth",
        ...overrides,
    }
}

/**
 * Maps LogLevel to Severity hierarchically per RFC 5424.
 * Each level includes itself and all more-severe levels.
 */
const logLevelToSeverity: Record<LogLevel, string[]> = {
    debug: ["debug", "info", "notice", "warning", "error", "critical", "alert", "emergency"],
    info: ["info", "notice", "warning", "error", "critical", "alert", "emergency"],
    warn: ["warning", "error", "critical", "alert", "emergency"],
    error: ["error", "critical", "alert", "emergency"],
}

const isValidLogLevel = (value: string | undefined): value is LogLevel => {
    return value === "debug" || value === "info" || value === "warn" || value === "error"
}

const getSeverityLevel = (severity: string): number => {
    const severities: Record<string, number> = {
        emergency: 0,
        alert: 1,
        critical: 2,
        error: 3,
        warning: 4,
        notice: 5,
        info: 6,
        debug: 7,
    }
    return severities[severity] ?? 6
}

export const createStructuredData = (data: Record<string, string | number | boolean>, sdID = "metadata"): string => {
    const entries = Object.entries(data)
    if (entries.length === 0) return `[${sdID}]`
    const values = entries.map(([key, value]) => `${key}="${String(value).replace(/(["\\\]])/g, "\\$1")}"`).join(" ")
    return `[${sdID} ${values}]`
}

export const createSyslogMessage = (options: SyslogOptions): string => {
    const { timestamp, hostname, appName = "aura-auth", procId = "-", msgId, structuredData, message } = options
    const pri = (options.facility ?? 16) * 8 + getSeverityLevel(options.severity)
    const structuredDataStr = createStructuredData(structuredData ?? {})
    return `<${pri}>1 ${timestamp} ${hostname} ${appName} ${procId} ${msgId} ${structuredDataStr} ${message}`
}

export const createLogger = (logger?: Required<Logger>): InternalLogger | undefined => {
    if (!logger) return undefined
    const level = logger.level
    const allowedSeverities = logLevelToSeverity[level] ?? []

    return {
        level,
        log<T extends keyof typeof logMessages>(key: T, overrides?: Partial<SyslogOptions>) {
            const entry = createLogEntry(key, overrides)
            if (!allowedSeverities.includes(entry.severity)) return entry
            logger.log({
                timestamp: entry.timestamp,
                appName: entry.appName ?? "aura-auth",
                hostname: entry.hostname ?? "aura-auth",
                ...entry,
            })
            return entry
        },
    }
}

/**
 * Creates the logger instance based on the provided configuration and environment variables.
 * Priority: config.logger, LOG_LEVEL env, DEBUG env and defaults to undefined if logging is not enabled.
 */
export const createProxyLogger = <Identity extends Identities, SignUpSchema extends SchemaTypes>(
    config?: AuthConfig<Identity, SignUpSchema>
) => {
    const level = getEnv("LOG_LEVEL")
    const debug = getEnvBoolean("DEBUG")
    if (typeof config?.logger === "object") {
        return createLogger({
            log: config.logger?.log || createSyslogMessage,
            level: isValidLogLevel(config.logger?.level) ? config.logger?.level : isValidLogLevel(level) ? level : "error",
        })
    }
    if (debug || config?.logger === true || level) {
        return createLogger({
            level: isValidLogLevel(level) ? level : "debug",
            log: (options) => {
                const message = createSyslogMessage(options)
                console.log(message)
            },
        })
    }
    return undefined
}
