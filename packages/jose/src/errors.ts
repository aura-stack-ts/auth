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
 * @todo: add link attribute to docs when available
 */
export class AuraJoseError extends Error {
    static code = "ERR_AURA_JOSE_ERROR"
    public readonly code: string

    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = new.target.name
        this.code = new.target.code
        if (hasCaptureStackTrace(Error)) {
            Error.captureStackTrace?.(this, new.target)
        }
    }
}

export class JWTEncodingError extends AuraJoseError {
    static code = "ERR_JWT_ENCODING"
}

export class JWTDecodingError extends AuraJoseError {
    static code = "ERR_JWT_DECODING"
}

export class InvalidPayloadError extends AuraJoseError {
    static code = "ERR_INVALID_PAYLOAD"
}

export class JWSVerificationError extends AuraJoseError {
    static code = "ERR_JWS_VERIFICATION"
}

export class JWSSigningError extends AuraJoseError {
    static code = "ERR_JWS_SIGNING"
}

export class JWEDecryptionError extends AuraJoseError {
    static code = "ERR_JWE_DECRYPTION"
}

export class JWEEncryptionError extends AuraJoseError {
    static code = "ERR_JWE_ENCRYPTION"
}

export class InvalidSecretError extends AuraJoseError {
    static code = "ERR_INVALID_SECRET"
}

export class KeyDerivationError extends AuraJoseError {
    static code = "ERR_KEY_DERIVATION"
}
