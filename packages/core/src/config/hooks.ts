import { isAuraAuthError } from "@/shared/errors/aura-error.ts"
import { isAuraRouterError, isAuraRouterValidationError, type OnErrorHook } from "@aura-stack/router"

export const onErrorHook: OnErrorHook<any, any> = ({ error, context }) => {
    if (isAuraRouterError(error) || isAuraRouterValidationError(error) || isAuraAuthError(error)) {
        return error.toResponse()
    }
    context.logger?.log("SERVER_ERROR", { structuredData: { error_type: error.name, error_message: error.message } })
    return Response.json({ type: "SERVER_ERROR", code: "SERVER_ERROR", message: "An unexpected error occurred" }, { status: 500 })
}
