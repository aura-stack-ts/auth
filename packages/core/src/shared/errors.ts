import type { AuthInternalErrorCode, AuthSecurityErrorCode, ErrorType, LiteralUnion } from "@/@types/index.ts"

interface V8ErrorConstructor extends ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

/**
 * Type guard to check if the current runtime environment
 * supports Error.captureStackTrace.
 */
export const hasCaptureStackTrace = (errorConstructor: ErrorConstructor): errorConstructor is V8ErrorConstructor => {
    return (
        typeof errorConstructor === "function" &&
        "captureStackTrace" in errorConstructor &&
        typeof (errorConstructor as any).captureStackTrace === "function"
    )
}

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
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
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
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
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
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export class AuthClientError extends Error {
    readonly type = "AUTH_CLIENT_ERROR"
    readonly code: string

    constructor(code: string, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export class AuthInvalidConfigurationError extends Error {
    readonly type = "AUTH_INVALID_CONFIGURATION_ERROR"

    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export class AuthValidationError extends Error {
    readonly type = "AUTH_VALIDATION_ERROR"
    readonly code: string

    constructor(code: string, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export class AuthJoseInitializationError extends Error {
    readonly type = "JOSE_INITIALIZATION_FAILED"
    readonly code: string

    constructor(code: string, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
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

export const isAuthClientError = (error: unknown): error is AuthClientError => {
    return error instanceof AuthClientError
}

export const isAuthInvalidConfigurationError = (error: unknown): error is AuthInvalidConfigurationError => {
    return error instanceof AuthInvalidConfigurationError
}

export const isAuthValidationError = (error: unknown): error is AuthValidationError => {
    return error instanceof AuthValidationError
}

export const isAuthErrorWithCode = (error: unknown): error is { code: string; message: string } => {
    return isAuthInternalError(error) || isAuthSecurityError(error) || isAuthClientError(error) || isAuthValidationError(error)
}
