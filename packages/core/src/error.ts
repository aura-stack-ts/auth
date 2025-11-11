import type { ErrorTypes, LiteralUnion } from "./@types/index.js"
import { OAuthAccessTokenErrorResponse, OAuthAuthorizationErrorResponse } from "./schemas.js"
import { toCastCase } from "./utils.js"

/**
 * Error class for all Aura Auth errors.
 */
export class AuthError extends Error {
    public readonly type: LiteralUnion<ErrorTypes>

    constructor(type: LiteralUnion<ErrorTypes>, message: string) {
        super(message)
        this.type = type
        this.name = "AuthError"
    }
}

/**
 * Verifies if the provided error is an instance of AuthError.
 *
 * @param error The error to be checked
 * @returns True if the error is an instance of AuthError, false otherwise
 */
export const isAuthError = (error: unknown): error is AuthError => {
    return error instanceof AuthError
}

/**
 * Captures and Error and verifies if it's an AuthError, rethrowing it if so.
 * If it's a different type of error, it wraps it in a new AuthError with the provided message.
 *
 * @param error The error to be processed
 * @param message The error message to be used if wrapping the error
 */
export const throwAuthError = (error: unknown, message?: string) => {
    if (error instanceof Error) {
        if (isAuthError(error)) {
            throw error
        }
        throw new AuthError("invalid_request", error.message ?? message)
    }
}

/**
 * Errores responses returned by the OAuth flows including Authorization and Access Token errors.
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
 */
export const ERROR_RESPONSE = {
    AUTHORIZATION: toCastCase(OAuthAuthorizationErrorResponse.shape.error.enum, "upper"),
    ACCESS_TOKEN: toCastCase(OAuthAccessTokenErrorResponse.shape.error.enum, "upper"),
}
