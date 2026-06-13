import { isAuraAuthError } from "@/shared/unstable_error.ts"
import { isInvalidZodSchemaError, isRouterError, type RouterConfig } from "@aura-stack/router"
import type { InternalLogger } from "@/@types/index.ts"

export const createErrorHandler = (logger?: InternalLogger): RouterConfig["onError"] => {
    return (error) => {
        if (isRouterError(error)) {
            const { message, status, statusText } = error
            logger?.log("ROUTER_INTERNAL_ERROR")
            return Response.json({ type: "ROUTER_ERROR", code: "ROUTER_INTERNAL_ERROR", message }, { status, statusText })
        }
        if (isInvalidZodSchemaError(error)) {
            logger?.log("INVALID_REQUEST")
            return Response.json({ type: "ROUTER_ERROR", code: "INVALID_REQUEST", message: error.errors }, { status: 422 })
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
