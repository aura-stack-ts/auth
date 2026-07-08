export const AuraErrorCode = {
    /**
     * JWT and JOSE Errors
     */
    JWT_EXPIRED: "JWT_EXPIRED",
    JWT_INVALID_SIGNATURE: "JWT_INVALID_SIGNATURE",
    JWT_MALFORMED: "JWT_MALFORMED",
    JWT_ALGORITHM_MISMATCH: "JWT_ALGORITHM_MISMATCH",
    JWT_KEY_ROTATION_FAILED: "JWT_KEY_ROTATION_FAILED",
    JWT_SEAL_FAILED: "JWT_SEAL_FAILED",
    JWT_UNSEAL_FAILED: "JWT_UNSEAL_FAILED",
    JWT_INVALID_MODE: "JWT_INVALID_MODE",
    /**
     * CSRF Tokens Errors
     */
    CSRF_TOKEN_MISSING: "CSRF_TOKEN_MISSING",
    CSRF_TOKEN_MISMATCH: "CSRF_TOKEN_MISMATCH",
    CSRF_ORIGIN_REJECTED: "CSRF_ORIGIN_REJECTED",
    CSRF_DOUBLE_SUBMIT_FAILED: "CSRF_DOUBLE_SUBMIT_FAILED",
    /**
     * Session Errors
     */
    SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
    SESSION_EXPIRED: "SESSION_EXPIRED",
    SESSION_REVOKED: "SESSION_REVOKED",
    SESSION_INVALID: "SESSION_INVALID",
    SESSION_STRATEGY_MISMATCH: "SESSION_STRATEGY_MISMATCH",
    SESSION_STORE_UNAVAILABLE: "SESSION_STORE_UNAVAILABLE",
    UPDATE_SESSION_INVALID: "UPDATE_SESSION_INVALID",
    INVALID_SESSION_STRATEGY: "INVALID_SESSION_STRATEGY",
    /**
     * Cookie Errors
     */
    COOKIE_NOT_FOUND: "COOKIE_NOT_FOUND",
    COOKIE_INVALID_VALUE: "COOKIE_INVALID_VALUE",
    SET_COOKIE_NOT_FOUND: "SET_COOKIE_NOT_FOUND",
    SET_COOKIE_INVALID_VALUE: "SET_COOKIE_INVALID_VALUE",
    /**
     * Auth Errors
     */
    AUTH_CREDENTIALS_INVALID: "AUTH_CREDENTIALS_INVALID",
    AUTH_PROVIDER_REJECTED: "AUTH_PROVIDER_REJECTED",
    AUTH_CALLBACK_STATE_INVALID: "AUTH_CALLBACK_STATE_INVALID",
    AUTH_MFA_REQUIRED: "AUTH_MFA_REQUIRED",
    AUTH_MFA_CODE_INVALID: "AUTH_MFA_CODE_INVALID",
    USER_CREATION_FAILED: "USER_CREATION_FAILED",
    AUTH_BASIC_CREDENTIALS_INVALID: "AUTH_BASIC_CREDENTIALS_INVALID",
    /**
     * Configuration Errors
     */
    CONFIG_INVALID: "CONFIG_INVALID",
    CONFIG_MISSING_REQUIRED: "CONFIG_MISSING_REQUIRED",
    CONFIG_BASE_URL_MISSING: "CONFIG_BASE_URL_MISSING",
    INVALID_AUTH_CONFIGURATION: "INVALID_AUTH_CONFIGURATION",
    INVALID_TRUSTED_ORIGIN: "INVALID_TRUSTED_ORIGIN",
    CLIENT_BASE_URL_MISSING: "CLIENT_BASE_URL_MISSING",
    POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED: "POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED",
    JOSE_INITIALIZATION_SALT_MISSING: "JOSE_INITIALIZATION_SALT_MISSING",
    JOSE_INITIALIZATION_SECRET_MISSING: "JOSE_INITIALIZATION_SECRET_MISSING",
    INVALID_SALT_SECRET_VALUE: "INVALID_SALT_SECRET_VALUE",
    INVALID_PEM_KEY_PAIR_MODE_MISMATCH: "INVALID_PEM_KEY_PAIR_MODE_MISMATCH",
    INVALID_PEM_KEY_PAIR_SINGLE_MISMATCH: "INVALID_PEM_KEY_PAIR_SINGLE_MISMATCH",
    AUTH_INVALID_PROXY_HEADERS_CONFIG: "AUTH_INVALID_PROXY_HEADERS_CONFIG",
    /**
     * OAuth Errors
     */
    UNSUPPORTED_OAUTH_CONFIGURATION: "UNSUPPORTED_OAUTH_CONFIGURATION",
    INVALID_ACCESS_TOKEN_OAUTH_CONFIG: "INVALID_ACCESS_TOKEN_OAUTH_CONFIG",
    INVALID_OAUTH_ACCESS_TOKEN_RESPONSE: "INVALID_OAUTH_ACCESS_TOKEN_RESPONSE",
    INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT: "INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT",
    INVALID_ACCESS_TOKEN: "INVALID_ACCESS_TOKEN",
    UNKNOWN_OAUTH_ACCESS_TOKEN_ERROR: "UNKNOWN_OAUTH_ACCESS_TOKEN_ERROR",
    INVALID_USER_INFO: "INVALID_USER_INFO",
    INVALID_OAUTH_USER_INFO_RESPONSE: "INVALID_OAUTH_USER_INFO_RESPONSE",
    INVALID_OAUTH_USER_INFO_RES_FORMAT: "INVALID_OAUTH_USER_INFO_RES_FORMAT",
    UNKNOWN_OAUTH_USER_INFO_ERROR: "UNKNOWN_OAUTH_USER_INFO_ERROR",
    INVALID_CUSTOM_USER_INFO_ERROR: "INVALID_CUSTOM_USER_INFO_ERROR",
    UNKNOWN_CUSTOM_USER_INFO_ERROR: "UNKNOWN_CUSTOM_USER_INFO_ERROR",
    AUTH_CALLBACK_MISSING_PARAMETERS: "AUTH_CALLBACK_MISSING_PARAMETERS",
    AUTH_MISMATCHING_STATE: "AUTH_MISMATCHING_STATE",
    INVALID_OAUTH_PROVIDER_URL_CONFIG: "INVALID_OAUTH_PROVIDER_URL_CONFIG",
    INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG: "INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG",
    DUPLICATED_OAUTH_PROVIDER_ID: "DUPLICATED_OAUTH_PROVIDER_ID",
    INVALID_ENVIRONMENT_CONFIGURATION: "INVALID_ENVIRONMENT_CONFIGURATION",
    PKCE_VERIFIER_INVALID: "PKCE_VERIFIER_INVALID",
    OAUTH_INVALID_CONTENT_TYPE: "OAUTH_INVALID_CONTENT_TYPE",
    OAUTH_INVALID_REFRESH_TOKEN_CONFIG: "OAUTH_INVALID_REFRESH_TOKEN_CONFIG",
    OAUTH_INVALID_REFRESH_TOKEN_RESPONSE: "OAUTH_INVALID_REFRESH_TOKEN_RESPONSE",

    /**
     * Schema Errors
     */
    SCHEMA_INVALID_MODE: "SCHEMA_INVALID_MODE",
    SCHEMA_UNSUPPORTED: "SCHEMA_UNSUPPORTED",
    SCHEMA_PARSER_FAILED: "SCHEMA_PARSER_FAILED",
    /**
     * Network Errors
     */
    NETWORK_REQUEST_FAILED: "NETWORK_REQUEST_FAILED",
    NETWORK_TIMEOUT: "NETWORK_TIMEOUT",
    /**
     * OpenID Connect Errors
     */
    OIDC_DISCOVERY_INVALID_RESPONSE: "OIDC_DISCOVERY_INVALID_RESPONSE",
    OIDC_DISCOVERY_NETWORK_FAILED: "OIDC_DISCOVERY_NETWORK_FAILED",
    OIDC_DISCOVERY_INVALID_FORMAT_RESPONSE: "OIDC_DISCOVERY_INVALID_FORMAT_RESPONSE",
    OIDC_DISCOVERY_ISSUER_MISMATCH: "OIDC_DISCOVERY_ISSUER_MISMATCH",
    OIDC_DISCOVERY_INVALID_SCHEMA: "OIDC_DISCOVERY_INVALID_SCHEMA",
    OIDC_NONCE_MISMATCH: "OIDC_NONCE_MISMATCH",
    OIDC_ID_TOKEN_INVALID: "OIDC_ID_TOKEN_INVALID",
    OIDC_USERINFO_INVALID_SCHEMA: "OIDC_USERINFO_INVALID_SCHEMA",
    OIDC_JWKS_INVALID_RESPONSE: "OIDC_JWKS_INVALID_RESPONSE",
    OIDC_JWKS_INVALID_SCHEMA: "OIDC_JWKS_INVALID_SCHEMA",
    OIDC_INVALID_ISSUER_PARAMS: "OIDC_INVALID_ISSUER_PARAMS",

    /**
     * User Info Refresh Errors
     */
    INVALID_ACCESS_TOKEN_RETRIVING_REFRESH_USER_INFO: "INVALID_ACCESS_TOKEN_RETRIVING_REFRESH_USER_INFO",
    INVALID_REFRESH_USER_INFO_RESPONSE: "INVALID_REFRESH_USER_INFO_RESPONSE",
    INVALID_REFRESH_USER_INFO_NETWORK: "INVALID_REFRESH_USER_INFO_NETWORK",
} as const

export type AuraErrorCode = (typeof AuraErrorCode)[keyof typeof AuraErrorCode]

export type AuraErrorType =
    /**
     * Authentication lifecycle / session validation failures
     */
    | "AUTH_FLOW"
    /**
     * Identity provider / OAuth specification failures
     */
    | "PROTOCOL"
    /**
     * Gateway timeouts / Fetch errors / Server outages
     */
    | "NETWORK"
    /**
     * Bad user configurations / payload structural checking
     */
    | "VALIDATION"
    | "INTERNAL"

interface CatalogEntry {
    type: AuraErrorType
    statusCode: number
    message: string
    userMessage: string
    name: string
}

export const ERROR_CATALOG: Record<AuraErrorCode, CatalogEntry> = {
    /**
     * JWT and JOSE Errors
     */
    JWT_EXPIRED: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "JwtError",
        message: "The provided JSON Web Token has expired based on its 'exp' claim or maxExpiration (mexp) library settings.",
        userMessage: "Your session has expired based on its max expiration. Please sign in again.",
    },
    JWT_INVALID_SIGNATURE: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "JwtError",
        message:
            "The cryptographic signature verification failed. The token token may have been tampered with or signed with an invalid key.",
        userMessage: "Authentication failed. Please sign in again.",
    },
    JWT_MALFORMED: {
        type: "VALIDATION",
        statusCode: 401,
        name: "JwtError",
        message: "The token string does not conform to the standard JWS/JWT three-part structure (header.payload.signature).",
        userMessage: "Authentication failed. Please sign in again.",
    },
    JWT_ALGORITHM_MISMATCH: {
        type: "VALIDATION",
        statusCode: 401,
        name: "JwtError",
        message:
            "The token header specifies an 'alg' that is not permitted by your local library security configuration restrictions.",
        userMessage: "Authentication failed. Please sign in again.",
    },
    JWT_KEY_ROTATION_FAILED: {
        type: "INTERNAL",
        statusCode: 500,
        name: "JwtError",
        message: "Failed to fetch or parse the remote JSON Web Key Set (JWKS) during an automatic signature key rotation cycle.",
        userMessage: "An internal error occurred. Please try again.",
    },
    JWT_SEAL_FAILED: {
        type: "INTERNAL",
        statusCode: 500,
        name: "JwtError",
        message:
            "The HKDF key derivation or AES-GCM encryption pipeline failed while trying to encrypt/seal the session payload.",
        userMessage: "An internal error occurred. Please try again.",
    },
    JWT_UNSEAL_FAILED: {
        type: "INTERNAL",
        statusCode: 500,
        name: "JwtError",
        message:
            "The decryption pattern or integrity authentication tag validation failed during the token unseal execution loop.",
        userMessage: "Authentication failed. Please sign in again.",
    },
    JWT_INVALID_MODE: {
        type: "VALIDATION",
        statusCode: 500,
        name: "JwtError",
        message:
            "The specified session mode does not match structural constraints. Expected configurations: 'sealed', 'signed', or 'encrypted'.",
        userMessage: "Invalid JWT mode configured. Valid options are: 'sealed', 'signed', 'encrypted'.",
    },
    /**
     * CSRF Tokens Errors
     */
    CSRF_TOKEN_MISSING: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "CsrfError",
        message:
            "State tracking failed because the required CSRF token cookie could not be extracted from incoming request headers.",
        userMessage: "The CSRF token is missing. Please refresh and try again.",
    },
    CSRF_TOKEN_MISMATCH: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "CsrfError",
        message:
            "Security violation: The request payload/header anti-forgery token string does not match the value stored in the secure session cookie.",
        userMessage: "CSRF token verification failed. Please refresh and try again.",
    },
    CSRF_ORIGIN_REJECTED: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "CsrfError",
        message:
            "Cross-Origin request blocked: The incoming Request 'Origin' header does not match the expected application Host or trusted subdomains.",
        userMessage: "Request validation failed. Request origin is untrusted.",
    },
    CSRF_DOUBLE_SUBMIT_FAILED: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "CsrfError",
        message:
            "The state verification engine failed because the custom 'X-CSRF-Token' header was missing from the mutation request parameters.",
        userMessage: "The CSRF header is missing. Please refresh and try again.",
    },
    /**
     * Session Errors
     */
    SESSION_NOT_FOUND: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "SessionError",
        message:
            "The context evaluation phase failed because the target identifier sessionToken could not be pulled from the cookies object context.",
        userMessage: "The session token is not found. There is no active session.",
    },
    SESSION_EXPIRED: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "SessionError",
        message:
            "The user session lifecycle timestamp has exceeded the absolute maximum duration threshold specified in storage settings.",
        userMessage: "Your session has expired. Please sign in again.",
    },
    SESSION_REVOKED: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "SessionError",
        message:
            "The session block execution was aborted because the target token was explicitly blacklisted or flagged as inactive in persistence layer checks.",
        userMessage: "Your session has been revoked. Please sign in again.",
    },
    SESSION_INVALID: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "SessionError",
        message:
            "The framework extracted a session token string, but it failed basic integrity decoding checks or cryptographic signatures.",
        userMessage: "The session is not valid. Its signature or decryption parameters failed.",
    },
    SESSION_STRATEGY_MISMATCH: {
        type: "VALIDATION",
        statusCode: 500,
        name: "SessionError",
        message:
            "The storage strategy context configuration doesn't align with active adapter engines (e.g. database adapter passed but strategy forced to pure 'jwt').",
        userMessage: "The session handling configuration strategy is mismatched.",
    },
    SESSION_STORE_UNAVAILABLE: {
        type: "INTERNAL",
        statusCode: 503,
        name: "SessionError",
        message:
            "The backing session persistence manager or distributed key-value store cache failed to respond within operational timeout limits.",
        userMessage: "Service temporarily unavailable. Please try again.",
    },
    UPDATE_SESSION_INVALID: {
        type: "AUTH_FLOW",
        statusCode: 400,
        name: "SessionError",
        message:
            "The internal call to 'refreshSession' completed, but returned a nullish value, meaning token mutation could not finish cleanly.",
        userMessage: "Failed to update session parameters.",
    },
    INVALID_SESSION_STRATEGY: {
        type: "VALIDATION",
        statusCode: 500,
        name: "SessionError",
        message: "The provided 'session.strategy' option string value is unsupported by the engine runtime core configurations.",
        userMessage: "Unknown session strategy configured. Valid options are: 'jwt'.",
    },

    /**
     * Cookie Errors
     */
    COOKIE_NOT_FOUND: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "CookieError",
        message:
            "The request pipeline expected parsing access to a 'Cookie' header block, but the raw header property evaluates to undefined.",
        userMessage: "No cookies found. There is no active session.",
    },
    COOKIE_INVALID_VALUE: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "CookieError",
        message:
            "A target cookie identifier was discovered by the parser, but its internal string value payload resolved to blank or nullish data.",
        userMessage: "Expected configuration cookie not found or contains an empty value.",
    },
    SET_COOKIE_NOT_FOUND: {
        type: "INTERNAL",
        statusCode: 500,
        name: "CookieError",
        message:
            "The outbound Response middleware pipeline completed execution, but no structural 'Set-Cookie' header operations were registered.",
        userMessage: "No cookies found in the application response.",
    },
    SET_COOKIE_INVALID_VALUE: {
        type: "INTERNAL",
        statusCode: 500,
        name: "CookieError",
        message:
            "The system attempted to assign outbound state, but the generated value parameter evaluation payload returned a nullish value.",
        userMessage: "The response cookie update target string has a nullish value.",
    },
    /**
     * Auth Errors
     */
    AUTH_CREDENTIALS_INVALID: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "AuthError",
        message:
            "The custom user 'authorize' handler function returned a nullish profile structure object or explicitly threw a mismatch validation signal.",
        userMessage: "The user's session couldn't be established with the provided credentials.",
    },
    AUTH_PROVIDER_REJECTED: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "AuthError",
        message:
            "The downstream identity provider rejected verification protocols or explicit request parameters during handshake loops.",
        userMessage: "Authentication provider error. Please try again.",
    },
    AUTH_CALLBACK_STATE_INVALID: {
        type: "PROTOCOL",
        statusCode: 400,
        name: "AuthError",
        message:
            "The incoming state value from the third-party endpoint query string failed basic framework schema or parsing validations.",
        userMessage: "Invalid authentication state. Please try again.",
    },
    AUTH_MFA_REQUIRED: {
        type: "AUTH_FLOW",
        statusCode: 403,
        name: "AuthError",
        message:
            "Primary credential step passed, but system identity rules dictate intercepting execution to wait for a Multi-Factor token challenge verification.",
        userMessage: "Multi-factor authentication check is required to continue.",
    },
    AUTH_MFA_CODE_INVALID: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "AuthError",
        message:
            "The custom Multi-Factor authentication TOTP/HOTP or SMS code submission string failed validation verification checks against host rules.",
        userMessage: "The multi-factor verification code is invalid.",
    },
    USER_CREATION_FAILED: {
        type: "INTERNAL",
        statusCode: 500,
        name: "AuthError",
        message:
            "The custom lifecycle hook 'onCreateUser' aborted execution, thrown exception handling traps, or returned an unexpected null reference mapping.",
        userMessage: "Failed to create user account with the provided metadata payload.",
    },
    AUTH_BASIC_CREDENTIALS_INVALID: {
        type: "AUTH_FLOW",
        statusCode: 401,
        name: "AuthError",
        message:
            "The HTTP Basic Authentication header failed credential verification. The decoded username and password pair did not match any user records or the authentication provider rejected the credentials.",
        userMessage: "The username or password is incorrect. Please verify your credentials and try again.",
    },
    /**
     * Configuration Errors
     */
    CONFIG_INVALID: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "The primary configuration object argument failed initial structural layout runtime checks during engine context setups.",
        userMessage: "An internal library validation error occurred.",
    },
    CONFIG_MISSING_REQUIRED: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "Crucial framework setup options are absent. Verify that required structural fields are present during initialization mappings.",
        userMessage: "Required core environment parameters are missing from registration settings.",
    },
    CONFIG_BASE_URL_MISSING: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message: "The application base URL could not be resolved from the current runtime configuration.",
        userMessage: "The application base URL is missing. Set BASE_URL or provide valid host/proxy headers.",
    },
    INVALID_AUTH_CONFIGURATION: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "The system cannot establish request resolution routes. Provide a valid 'BASE_URL' system environment configuration value or setup trusted proxy headers.",
        userMessage: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
    },
    INVALID_TRUSTED_ORIGIN: {
        type: "VALIDATION",
        statusCode: 400,
        name: "ConfigError",
        message:
            "The request location context was blocked. The incoming value does not match patterns mapped inside your array configuration rules.",
        userMessage: "The incoming ORIGIN is not trusted. Verify your trustedOrigins configuration.",
    },
    CLIENT_BASE_URL_MISSING: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "The client wrapper utility was instantiated inside a non-browser environment (Server Action, API route, etc.) without providing an explicit 'baseURL' fallback string property.",
        userMessage: "baseURL is required when createAuthClient is invoked outside browser environments.",
    },
    POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED: {
        type: "VALIDATION",
        statusCode: 400,
        name: "ConfigError",
        message:
            "The downstream navigation parameter target path evaluation failed security context tracking verification. The destination URL domain is untrusted.",
        userMessage: "Invalid redirect path intercepted. Potential open redirect attack detected.",
    },
    JOSE_INITIALIZATION_SALT_MISSING: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "Core security initialization failed because both 'AURA_AUTH_SALT' and 'AUTH_SALT' environment string keys are completely missing from runtime access contexts.",
        userMessage: "AURA_AUTH_SALT or AUTH_SALT environment variable is not set. Salt required for key derivation.",
    },
    JOSE_INITIALIZATION_SECRET_MISSING: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "Core security initialization failed because both 'AURA_AUTH_SECRET' and 'AUTH_SECRET' environment string keys are completely missing from runtime access contexts.",
        userMessage: "AURA_AUTH_SECRET environment variable is not set and no fallback secret was provided.",
    },
    INVALID_SALT_SECRET_VALUE: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "The extracted salt string parameter does not fit minimum byte length requirements or baseline entropy targets needed for safe PBKDF2 key derivations.",
        userMessage: "The encryption salt value must be at least 32 bytes long and meet baseline entropy values.",
    },
    INVALID_PEM_KEY_PAIR_MODE_MISMATCH: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "A configuration layout rule conflict was detected. Multiple asymmetric keys were passed but the runtime 'session.mode' parameter was not forced to 'sealed'.",
        userMessage: "Multiple PEM Key Pairs found in runtime configurations require 'sealed' JWT mode.",
    },
    INVALID_PEM_KEY_PAIR_SINGLE_MISMATCH: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "A configuration layout rule conflict was detected. A single asymmetric key pair structure was loaded but the session processing mode was set to 'sealed'.",
        userMessage: "Single PEM key pairs from configurations require 'signed' or 'encrypted' JWT mode.",
    },
    UNSUPPORTED_OAUTH_CONFIGURATION: {
        type: "VALIDATION",
        statusCode: 400,
        name: "OAuthError",
        message:
            "An execution request flow was initialized targeting a specific identity provider code string that doesn't exist within initialized provider definitions.",
        userMessage: "The targeted OAuth provider has not been configured in the initialization parameters.",
    },
    INVALID_ACCESS_TOKEN_OAUTH_CONFIG: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The runtime provider definition block lacks token endpoints, formatting methods, or client routing configurations required for handshake mutations.",
        userMessage: "The remote access token exchange profile setup parameters are invalid.",
    },
    INVALID_OAUTH_ACCESS_TOKEN_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The outbound HTTP request to the remote identity provider token exchange endpoint failed validation checks. The response 'ok' field resolved to false.",
        userMessage: "The authorization server rejected the request during the token exchange handshake.",
    },
    INVALID_OAUTH_ACCESS_TOKEN_RES_FORMAT: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The third-party authentication server responded with an HTTP status 200, but the returned data block structure fails schema verification (e.g. missing 'access_token').",
        userMessage: "The identity provider token payload did not satisfy standard schema formats.",
    },
    INVALID_ACCESS_TOKEN: {
        type: "PROTOCOL",
        statusCode: 401,
        name: "OAuthError",
        message:
            "The external authorization endpoint directly responded with an explicit error code payload parameter during token processing loops.",
        userMessage: "Failed to clear identity transport verification down to the provider.",
    },
    UNKNOWN_OAUTH_ACCESS_TOKEN_ERROR: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "An unexpected runtime code path crash or unclassified transport exception occurred during the remote provider access token exchange execution flow.",
        userMessage: "An unclassified token pipeline failure occurred during third-party processing.",
    },
    INVALID_USER_INFO: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The downstream mapping verification phase was aborted because the decoded third-party profile structure does not expose a stable immutable mapping key (id/sub/uid).",
        userMessage: "The provider profile identity map did not supply an immutable index key (id/sub/uid).",
    },
    INVALID_OAUTH_USER_INFO_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The downstream endpoint fetch request to the provider user profile storage API returned an invalid response code status.",
        userMessage: "The resource userInfo target server returned an error code response.",
    },
    INVALID_OAUTH_USER_INFO_RES_FORMAT: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The provider profile user data response format did not match semantic JSON object types required for downstream database generation.",
        userMessage: "The returned user info profile structure payload is corrupted or unexpected.",
    },
    UNKNOWN_OAUTH_USER_INFO_ERROR: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "An unmapped connection trap exploded during asynchronous background operations inside the default profile fetch pipeline routines.",
        userMessage: "Failed to communicate clean state down to the user configuration data provider.",
    },
    INVALID_CUSTOM_USER_INFO_ERROR: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The host application developer supplied a custom 'profile' mapping block callback method, but the return value runtime resolution returned undefined or threw an error.",
        userMessage: "The custom userinfo mapper callback returned an empty payload reference or threw.",
    },
    UNKNOWN_CUSTOM_USER_INFO_ERROR: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "An unclassified system runtime breakdown occurred while trying to process data records down inside the developer's user profile normalization routine.",
        userMessage: "An internal engine exception stopped custom resource user tracking map executions.",
    },
    AUTH_CALLBACK_MISSING_PARAMETERS: {
        type: "PROTOCOL",
        statusCode: 400,
        name: "OAuthError",
        message:
            "The incoming callback route handler intercepted a processing execution path where query location search fields are missing vital OAuth spec values ('code' or 'state').",
        userMessage: "Expected security parameter state or exchange code is completely missing from request.",
    },
    AUTH_MISMATCHING_STATE: {
        type: "PROTOCOL",
        statusCode: 400,
        name: "OAuthError",
        message:
            "CSRF state attack prevented. The 'state' payload value extracted from incoming third-party route query properties doesn't match local session storage values.",
        userMessage: "The provided state passed in the OAuth response does not match the stored token state.",
    },
    INVALID_OAUTH_PROVIDER_URL_CONFIG: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "A required structural provider URL definition configuration parameter is empty or holds an invalid URI layout inside your provider customization registry.",
        userMessage: "The authorization gateway URL setup rule is missing from the custom provider setup object.",
    },
    INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The loaded configuration settings array failed standard library schema validation checks against required engine operational footprints.",
        userMessage: "The provider context configuration properties failed standard schema verification checks.",
    },
    DUPLICATED_OAUTH_PROVIDER_ID: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The registration collection contains duplicate identifier keys. Unique registration indices are mandatory across tracking providers.",
        userMessage: "Duplicate identification keys detected in the engine providers registration list.",
    },
    INVALID_ENVIRONMENT_CONFIGURATION: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The framework cannot resolve environment credentials for the current provider target. Make sure target system secret variables are configured properly.",
        userMessage: "Client identification strings or secret hashes are missing from configuration contexts.",
    },
    PKCE_VERIFIER_INVALID: {
        type: "PROTOCOL",
        statusCode: 400,
        name: "OAuthError",
        message:
            "The generated or passed PKCE 'code_verifier' configuration string structure does not fulfill security specification layout rules (must be between 43 and 128 characters long).",
        userMessage: "The cryptographic dynamic code verifier does not fit structural specification constraints (43-128 chars).",
    },
    AUTH_INVALID_PROXY_HEADERS_CONFIG: {
        type: "VALIDATION",
        statusCode: 500,
        name: "ConfigError",
        message:
            "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors.",
        userMessage:
            "Internal configuration failure. Enabling trusted proxy headers requires an explicit trusted origins array setup.",
    },
    OAUTH_INVALID_CONTENT_TYPE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OAuthError",
        message:
            "The remote identity provider endpoint returned an invalid Content-Type header. Expected 'application/json', but received an incompatible format (e.g., text/html). This usually indicates an upstream server error, proxy block, or provider outage.",
        userMessage:
            "The identity provider returned an unreadable response format. Please try again or check the provider status.",
    },
    /**
     * Schema Errors
     */
    SCHEMA_INVALID_MODE: {
        type: "VALIDATION",
        statusCode: 500,
        name: "SchemaError",
        message:
            "The identity mapping configuration validation mode string is unsupported. Supported string flags: 'strip', 'passthrough', 'strict', 'partial'.",
        userMessage: "Unsupported schema parsing parameters configuration. Options: 'strip', 'passthrough', 'strict', 'partial'.",
    },
    SCHEMA_UNSUPPORTED: {
        type: "VALIDATION",
        statusCode: 500,
        name: "SchemaError",
        message:
            "The library failed to find a matching validator compiler module. The custom strategy must inherit from supported engines: Zod, Valibot, Typebox, or Arktype.",
        userMessage: "Unsupported structural compilation type. Supported adapters: Zod, Valibot, Typebox, Arktype.",
    },
    SCHEMA_PARSER_FAILED: {
        type: "VALIDATION",
        statusCode: 500,
        name: "SchemaError",
        message:
            "The schema validator failed to parse or execute the configured schema. This typically indicates a malformed schema definition or a runtime parser issue inside the selected validation adapter.",
        userMessage:
            "An internal schema parsing error occurred. Please verify your schema configuration and validation adapter setup.",
    },
    /**
     * Network Errors
     */
    NETWORK_REQUEST_FAILED: {
        type: "NETWORK",
        statusCode: 502,
        name: "NetworkError",
        message:
            "The internal network wrapper failed to establish a secure HTTP connection handshake with upstream servers or external REST resource targets.",
        userMessage: "An internal outgoing transport network execution failed down to external services.",
    },
    NETWORK_TIMEOUT: {
        type: "NETWORK",
        statusCode: 504,
        name: "NetworkError",
        message:
            "The external API target connection pool or request fetch signal context exceeded designated millisecond timeout threshold rules without returning headers.",
        userMessage: "The network response time tracking expired before receiving data headers.",
    },
    /**
     * OpenID Connect Errors
     */
    OIDC_DISCOVERY_INVALID_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OidcDiscoveryError",
        message:
            "The outbound HTTP request to the OpenID Connect metadata endpoint configuration route returned a non-2xx status code. The response 'ok' field resolved to false.",
        userMessage: "The OpenID Connect discovery endpoint rejected the configuration request or is currently unreachable.",
    },
    OIDC_DISCOVERY_NETWORK_FAILED: {
        type: "NETWORK",
        statusCode: 504,
        name: "OidcDiscoveryError",
        message:
            "An unhandled transport exception, socket hang-up, or DNS resolution failure occurred while communicating with the remote OIDC identity service provider context.",
        userMessage:
            "A network pipeline failure occurred while discovering configuration metadata properties from the third-party provider.",
    },
    OIDC_DISCOVERY_INVALID_FORMAT_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OidcDiscoveryError",
        message:
            "The OIDC discovery endpoint returned a payload structure that could not be parsed as a valid JSON object. The stream processing operation failed.",
        userMessage: "The OIDC discovery document format is malformed or corrupted.",
    },
    OIDC_DISCOVERY_ISSUER_MISMATCH: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OidcDiscoveryError",
        message:
            "OIDC metadata validation failed. The 'issuer' URL string returned in the remote discovery document does not exactly match the original provider base configuration URL. Verification stopped to prevent open validation or provider redirection vulnerabilities.",
        userMessage: "The identity provider configuration could not be securely verified due to a provider issuer mismatch.",
    },
    OIDC_DISCOVERY_INVALID_SCHEMA: {
        type: "VALIDATION",
        statusCode: 502,
        name: "OidcDiscoveryError",
        message:
            "The OIDC discovery document failed structural validation against the OpenID Provider Metadata schema. Required fields may be missing or malformed.",
        userMessage: "The identity provider discovery document is invalid or incomplete.",
    },
    OIDC_NONCE_MISMATCH: {
        type: "PROTOCOL",
        statusCode: 400,
        name: "OidcIdTokenError",
        message:
            "The nonce claim in the ID Token does not match the nonce value stored during the authorization request. This may indicate a replay attack or session mismatch.",
        userMessage: "Authentication failed due to a security validation error. Please sign in again.",
    },
    OIDC_ID_TOKEN_INVALID: {
        type: "PROTOCOL",
        statusCode: 401,
        name: "OidcIdTokenError",
        message:
            "The ID Token failed validation. The token may be malformed, expired, or contain invalid claims after signature verification.",
        userMessage: "Authentication failed. Please sign in again.",
    },
    OIDC_USERINFO_INVALID_SCHEMA: {
        type: "VALIDATION",
        statusCode: 502,
        name: "OidcUserInfoError",
        message: "The UserInfo endpoint response failed structural validation against the OpenID Connect standard claims schema.",
        userMessage: "The identity provider returned invalid user information.",
    },
    OIDC_JWKS_INVALID_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "OidcJwksError",
        message: "The outbound HTTP request to the JWKS endpoint returned a non-2xx status code or could not be retrieved.",
        userMessage: "The identity provider key set could not be retrieved.",
    },
    OIDC_JWKS_INVALID_SCHEMA: {
        type: "VALIDATION",
        statusCode: 502,
        name: "OidcJwksError",
        message:
            "The JWKS document failed structural validation against the JSON Web Key Set schema. Required keys array may be missing or malformed.",
        userMessage: "The identity provider key set format is invalid.",
    },
    OIDC_INVALID_ISSUER_PARAMS: {
        type: "VALIDATION",
        statusCode: 502,
        name: "OIDCInvalidIssuerError",
        message: "The configured OpenID Connect issuer parameters are missing or invalid, preventing issuer validation.",
        userMessage: "The identity provider configuration is invalid. Please check issuer settings and try again.",
    },
    OAUTH_INVALID_REFRESH_TOKEN_CONFIG: {
        type: "VALIDATION",
        statusCode: 500,
        name: "OAuthError",
        message:
            "The token refresh sequence was aborted because the targeted OAuth provider instance does not have a refresh token strategy configured. Ensure that your provider registration includes token rotation settings or appropriate scopes (e.g., 'offline_access').",
        userMessage:
            "Internal library configuration error. Token refresh operations are not enabled or configured for this identity provider.",
    },
    OAUTH_INVALID_REFRESH_TOKEN_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 401,
        name: "OAuthError",
        message:
            "The remote identity provider rejected the refresh token exchange request. The response 'ok' field resolved to false. This typically indicates that the refresh token has expired, been reused, or has been explicitly revoked by the end-user.",
        userMessage: "Your secure session renewal failed. Please sign in again to continue.",
    },
    INVALID_ACCESS_TOKEN_RETRIVING_REFRESH_USER_INFO: {
        type: "VALIDATION",
        statusCode: 401,
        name: "AuthError",
        message:
            "The profile refresh sequence was aborted because a valid access token could not be extracted or resolved from the current session context inside the refreshUserInfo function.",
        userMessage: "Failed to sync profile data. Your active session access token is missing or invalid.",
    },
    INVALID_REFRESH_USER_INFO_RESPONSE: {
        type: "PROTOCOL",
        statusCode: 502,
        name: "AuthError",
        message:
            "The outbound HTTP request to the provider user info profile endpoint returned a non-2xx status code during a synchronization sync block. The response 'ok' field resolved to false.",
        userMessage: "The identity provider rejected the request to update profile details.",
    },
    INVALID_REFRESH_USER_INFO_NETWORK: {
        type: "NETWORK",
        statusCode: 504,
        name: "AuthError",
        message:
            "A raw connection timeout, network failure, or socket hang-up occurred while trying to retrieve updated user info metadata from the remote identity platform.",
        userMessage: "A network transport failure prevented fetching updated profile data from the provider.",
    },
}

export interface AuraErrorOptions extends ErrorOptions {
    code: AuraErrorCode
    message?: string
    statusCode?: number
    userMessage?: string
}

interface V8ErrorConstructor extends ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

/**
 * Type guard to check if the current runtime environment
 * supports Error.captureStackTrace.
 */
export const hasCaptureStackTrace = (errorConstructor: ErrorConstructor): errorConstructor is V8ErrorConstructor => {
    return "captureStackTrace" in errorConstructor && typeof (errorConstructor as any).captureStackTrace === "function"
}

export class AuraAuthError extends Error {
    readonly code: AuraErrorCode
    readonly type: AuraErrorType
    readonly userMessage: string
    readonly statusCode: number

    constructor({ code, message, cause, statusCode, userMessage }: AuraErrorOptions) {
        const entry = ERROR_CATALOG[code]
        const finalInternalMessage = message ?? entry.message
        super(finalInternalMessage, { cause })

        this.name = entry.name
        this.code = code
        this.type = entry.type
        this.statusCode = statusCode ?? entry.statusCode
        this.userMessage = userMessage ?? entry.userMessage

        Object.setPrototypeOf(this, new.target.prototype)
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }

    toResponse() {
        return Response.json(
            { type: this.type, code: this.code, message: this.userMessage },
            { status: this.statusCode, statusText: this.code }
        )
    }
}

export const isAuraAuthError = (value: unknown): value is AuraAuthError => {
    return value instanceof AuraAuthError
}
