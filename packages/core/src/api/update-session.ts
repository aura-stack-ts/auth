import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getRedirectResponse } from "@/shared/utils/get-redirect-response.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { UpdateSessionAPIOptions, UpdateSessionAPIReturn, User } from "@/@types/index.ts"

export const updateSession = async <DefaultUser extends User = User>(
    context: FunctionAPIContext<UpdateSessionAPIOptions<DefaultUser>>
): Promise<UpdateSessionAPIReturn<DefaultUser>> => {
    const initHeaders = new Headers(secureApiHeaders)
    let cookieStore = getCookieStore({
        ctx: context.ctx,
        request: context.request ?? getInitialHeaders(undefined, context.headers),
    })
    try {
        const {
            request,
            rateLimit,
            sessionToken,
            rawSession,
            cookieStore: resolvedCookieStore,
        } = await createValidation(context)
            .buildRequest("/session")
            .verifyRateLimit("updateSession")
            .verifySession()
            .verifyUserStatus()
            .verifyCSRFToken()
            .execute()

        if (rateLimit) {
            return rateLimit as UpdateSessionAPIReturn<DefaultUser>
        }
        cookieStore = resolvedCookieStore

        const { session, headers } = await context.ctx.session.strategy.updateSession({
            session: context.session,
            rawSession,
            sessionToken,
            cookieStore,
        })

        const { redirect, redirectURL, status } = await getRedirectResponse({
            context,
            request,
            headers,
        })

        return toAPIResponse<UpdateSessionAPIReturn<DefaultUser>>({
            headers,
            session,
            success: true,
            redirect,
            redirectURL,
            status,
        })
    } catch (error) {
        errorToLogMessage(error, "UPDATE_SESSION_INVALID", context.ctx.logger)
        const { errors, statusCode } = handleApiError(error, "UPDATE_SESSION_INVALID", "Failed to update session.")
        const outHeaders = getAuraAuthHeaders(error, initHeaders)

        return toAPIResponse<UpdateSessionAPIReturn<DefaultUser>>({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            headers: outHeaders,
            silent: { error: errors },
            status: statusCode,
        })
    }
}
