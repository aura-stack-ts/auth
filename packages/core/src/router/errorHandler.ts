import { isInvalidZodSchemaError, isRouterError, type RouterConfig } from "@aura-stack/router"
import { isAuthInternalError, isAuthSecurityError, isAuthValidationError, isOAuthProtocolError } from "@/shared/errors.ts"
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
        if (isOAuthProtocolError(error)) {
            const { error: errorCode, message, type, errorURI } = error
            logger?.log("OAUTH_PROTOCOL_ERROR", {
                structuredData: {
                    error: errorCode,
                    error_description: message,
                    error_uri: errorURI ?? "",
                },
            })
            return Response.json(
                {
                    type,
                    message,
                },
                { status: 400 }
            )
        }
        if (isAuthInternalError(error)) {
            const { type, code, message } = error
            logger?.log("INVALID_OAUTH_CONFIGURATION", {
                structuredData: {
                    error: code,
                    error_description: message,
                },
            })
            return Response.json(
                {
                    type,
                    message,
                },
                { status: 400 }
            )
        }
        if (isAuthSecurityError(error)) {
            const { type, code, message } = error
            logger?.log("AUTH_SECURITY_ERROR", {
                structuredData: {
                    error: code,
                    error_description: message,
                },
            })
            return Response.json(
                {
                    type,
                    code,
                    message,
                },
                { status: 400 }
            )
        }
        if (isAuthValidationError(error)) {
            logger?.log("IDENTITY_VALIDATION_FAILED")
            const { type, code, message } = error
            return Response.json({ type, code, message }, { status: 422 })
        }
        logger?.log("SERVER_ERROR", { structuredData: { error_type: error.name, error_message: error.message } })
        return Response.json(
            { type: "SERVER_ERROR", code: "SERVER_ERROR", message: "An unexpected error occurred" },
            { status: 500 }
        )
    }
}
