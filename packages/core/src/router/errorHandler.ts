import { isAuraAuthError } from "@/shared/errors.ts"
import { isAuraRouterError, isAuraRouterValidationError, type RouterConfig } from "@aura-stack/router"
import type { InternalLogger } from "@/@types/index.ts"

export const createErrorHandler = (logger?: InternalLogger): RouterConfig["onError"] => {
    return (error) => {
        if (isAuraRouterError(error) || isAuraRouterValidationError(error)) {
            return error.toResponse()
        }
        if (isAuraAuthError(error)) {
            return error.toResponse()
        }
        logger?.log("SERVER_ERROR", { structuredData: { error_type: error.name, error_message: error.message } })
        return Response.json(
            { type: "SERVER_ERROR", code: "SERVER_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
