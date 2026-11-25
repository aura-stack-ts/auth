import { getErrorName } from "@/errors/aura-error.ts"
import { AuraAuthError, isAuraAuthError } from "@/errors/aura-error.ts"
import type { InternalLogger } from "@/@types/internal.ts"
import type { LOG_MESSAGES } from "@/config/logger/catalog.ts"

export const handleApiError = (error: unknown, defaultCode: string, defaultMessage: string, defaultStatus = 400) => {
    let code = defaultCode
    let message = defaultMessage
    let statusCode = defaultStatus
    if (isAuraAuthError(error)) {
        code = error.code
        message = error.userMessage
        statusCode = error.statusCode
    }
    return { code, message, errors: { code, message }, statusCode }
}

export const errorToLogMessage = (error: unknown, key: keyof typeof LOG_MESSAGES, logger?: InternalLogger) => {
    logger?.log(key, {
        structuredData: {
            error_type: getErrorName(error),
            error_code: error instanceof AuraAuthError ? error.code : "UNKNOWN_ERROR",
            error_message: error instanceof AuraAuthError ? error.message : String(error),
        },
    })
}
