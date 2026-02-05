import type { SyslogOptions } from "@/@types/index.js"

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
} as const

export const createLogEntry = <T extends keyof typeof logMessages>(key: T, overrides?: Partial<SyslogOptions>): SyslogOptions => {
    const message = logMessages[key]

    return {
        ...message,
        ...overrides,
    }
}
