import type { AuthInternalErrorCode, AuthSecurityErrorCode, ErrorType, LiteralUnion } from "@/@types/index.js"

/**
 * The object returned by the class to users its:
 *   - type: "OAUTH_PROTOCOL_ERROR" to identify the error type
 *   - error: A short error code
 *   - description: A human-readable description of the error. The description is obtained from the message property of the Error class
 *   - errorURI: A URI with more information about the error
 */
export class OAuthProtocolError extends Error {
    readonly type = "OAUTH_PROTOCOL_ERROR"
    public readonly error: string
    public readonly errorURI?: string

    constructor(error: LiteralUnion<Uppercase<ErrorType>>, description?: string, errorURI?: string, options?: ErrorOptions) {
        super(description, options)
        this.error = error
        this.errorURI = errorURI
        this.name = new.target.name
        Error.captureStackTrace(this, new.target)
    }
}

/**
 * The object returned when an internal error occurs in the Aura Auth library.
 *   - type: "AUTH_INTERNAL_ERROR" to identify the error type
 *   - message: A human-readable description of the error. The description is obtained from the message property of the Error class
 *   - code: An optional error code that can be used to identify the specific error, for example, LIKE "ERR_AUTH_INTERNAL_ERROR"
 */
export class AuthInternalError extends Error {
    readonly type = "AUTH_INTERNAL_ERROR"
    readonly code: string

    constructor(code: AuthInternalErrorCode, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        Error.captureStackTrace(this, new.target)
    }
}

/**
 * The object returned when a security error occurs in the Aura Auth library.
 *   - type: "AUTH_SECURITY_ERROR" to identify the error type
 *   - message: A human-readable description of the error. The description is obtained from the message property of the Error class
 *   - code: An optional error code that can be used to identify the specific error, for example, LIKE "ERR_AUTH_SECURITY_ERROR"
 */
export class AuthSecurityError extends Error {
    readonly type = "AUTH_SECURITY_ERROR"
    readonly code: string

    constructor(code: LiteralUnion<AuthSecurityErrorCode>, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        Error.captureStackTrace(this, new.target)
    }
}

export const isNativeError = (error: unknown): error is Error => {
    return error instanceof Error
}

export const isOAuthProtocolError = (error: unknown): error is OAuthProtocolError => {
    return error instanceof OAuthProtocolError
}

export const isAuthInternalError = (error: unknown): error is AuthInternalError => {
    return error instanceof AuthInternalError
}

export const isAuthSecurityError = (error: unknown): error is AuthSecurityError => {
    return error instanceof AuthSecurityError
}
