import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/cookie.ts"
import { toUnionHeaders } from "@/shared/utils.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { errorToLogMessage, handleApiError, toStandardizedHeaders } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { GetSessionAPIOptions, GetSessionAPIReturn, User } from "@/@types/index.ts"

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<GetSessionAPIReturn<DefaultUser>> => {
    const headers = new HeadersBuilder(secureApiHeaders)
        .setCookie(ctx.cookies.sessionToken.name, "", getExpiredCookie(ctx.cookies.sessionToken.attributes))
        .setCookie(ctx.cookies.csrfToken.name, "", getExpiredCookie(ctx.cookies.csrfToken.attributes))
        .toHeaders()
    const unauthorizedError = {
        code: "GET_SESSION_FAILED",
        message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
    } as const
    const unauthorized: GetSessionAPIReturn<DefaultUser> = {
        session: null,
        headers,
        success: false,
        error: unauthorizedError,
        toResponse: () => Response.json({ success: false, session: null }, { status: 401, headers }),
    }
    try {
        const { session, headers } = await ctx.sessionStrategy.getSession(toStandardizedHeaders(headersInit))
        if (!session) return unauthorized
        const newHeaders = toUnionHeaders(headers, secureApiHeaders)
        return {
            session,
            headers: newHeaders,
            success: true,
            toResponse: () => Response.json({ success: true, session }, { headers: newHeaders }),
        } as GetSessionAPIReturn<DefaultUser>
    } catch (error) {
        errorToLogMessage(error, "AUTH_SESSION_INVALID", ctx.logger)
        const { errors } = handleApiError(
            error,
            "GET_SESSION_FAILED",
            "Failed to retrieve session. The session token may be missing, expired, or invalid."
        )
        return {
            ...unauthorized,
            error: errors,
            toResponse: () => Response.json({ success: false, session: null }, { status: 401, headers }),
        }
    }
}
