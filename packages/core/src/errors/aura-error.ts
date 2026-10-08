import { ERROR_CATALOG, type AuraErrorCode, type AuraErrorType } from "@/errors/catalog.ts"

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

export const getErrorName = (error: unknown): string => {
    if (error instanceof Error) {
        return error.name
    }
    return typeof error === "string" ? error : "UnknownError"
}
