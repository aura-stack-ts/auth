import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { getCookieStore } from "@/shared/utils/get-cookie-store.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/handle-messages.ts"
import { getAuraAuthHeaders, getInitialHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { GetSessionAPIOptions, GetSessionAPIReturn, User } from "@/@types/index.ts"

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<GetSessionAPIReturn<DefaultUser>> => {
    const initHeaders = getInitialHeaders(undefined, headersInit)
    const cookieStore = getCookieStore({ ctx, request: initHeaders })
    try {
        const { session, headers } = await ctx.session.strategy.getSession({
            headers: initHeaders,
            cookieStore,
        })
        return toAPIResponse<GetSessionAPIReturn<DefaultUser>>({
            success: true,
            session,
            headers,
        })
    } catch (error) {
        errorToLogMessage(error, "AUTH_SESSION_INVALID", ctx.logger)
        const { errors, statusCode } = handleApiError(
            error,
            "GET_SESSION_FAILED",
            "Failed to retrieve session. The session token may be missing, expired, or invalid."
        )
        const headers = getAuraAuthHeaders(error, new Headers(secureApiHeaders))

        return toAPIResponse<GetSessionAPIReturn<DefaultUser>>({
            success: false,
            session: null,
            headers,
            silent: { error: errors },
            status: statusCode,
        })
    }
}
