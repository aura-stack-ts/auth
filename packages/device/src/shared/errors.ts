interface V8ErrorConstructor extends ErrorConstructor {
    captureStackTrace(targetObject: object, constructorOpt?: Function): void
}

const hasCaptureStackTrace = (errorConstructor: ErrorConstructor): errorConstructor is V8ErrorConstructor => {
    return (
        "captureStackTrace" in errorConstructor &&
        typeof (errorConstructor as V8ErrorConstructor).captureStackTrace === "function"
    )
}

export type DeviceAuthErrorCode = "NO_PENDING_AUTHORIZATION" | "INVALID_PROVIDER" | "INVALID_POLL_INPUT" | "POLL_TIMEOUT"

export class DeviceAuthError extends Error {
    readonly type = "DEVICE_AUTH_ERROR"
    readonly code: DeviceAuthErrorCode

    constructor(code: DeviceAuthErrorCode, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.code = code
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export type DeviceOAuthErrorCode =
    | "authorization_pending"
    | "slow_down"
    | "expired_token"
    | "access_denied"
    | "invalid_request"
    | "server_error"

export class DeviceOAuthError extends Error {
    readonly type = "DEVICE_OAUTH_ERROR"
    readonly error: DeviceOAuthErrorCode
    readonly errorDescription?: string

    constructor(error: DeviceOAuthErrorCode, description?: string, options?: ErrorOptions) {
        super(description, options)
        this.error = error
        this.errorDescription = description
        this.name = new.target.name
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace(this, new.target)
        }
    }
}

export const isDeviceAuthError = (error: unknown): error is DeviceAuthError => {
    return error instanceof DeviceAuthError
}

export const isDeviceOAuthError = (error: unknown): error is DeviceOAuthError => {
    return error instanceof DeviceOAuthError
}
