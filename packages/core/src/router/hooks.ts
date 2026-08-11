import { isAuraAuthError } from "@/shared/errors.ts"
import { isSecureConnection } from "@/shared/utils.ts"
import { isAuraRouterError, isAuraRouterValidationError, type OnErrorHook, type OnRequestHook } from "@aura-stack/router"

export const onErrorHook: OnErrorHook<any> = ({ error, context }) => {
    if (isAuraRouterError(error) || isAuraRouterValidationError(error) || isAuraAuthError(error)) {
        return error.toResponse()
    }
    context.logger?.log("SERVER_ERROR", { structuredData: { error_type: error.name, error_message: error.message } })
    return Response.json({ type: "SERVER_ERROR", code: "SERVER_ERROR", message: "An unexpected error occurred" }, { status: 500 })
}

export const onRequestHook: OnRequestHook = ({ request, context }) => {
    const useSecure = isSecureConnection(request, context.trustedProxyHeaders)
    // @ts-ignore
    context.cookies = useSecure ? context.cookieConfig.secure : context.cookieConfig.standard
}
