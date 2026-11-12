import { HeadersBuilder } from "@aura-stack/router"
import { getExpiredCookie } from "@/shared/http/cookie.ts"
import { getInitialHeaders } from "@/shared/http/headers.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { GetSessionAPIOptions, GetSessionAPIReturn, User } from "@/@types/index.ts"

export const getSession = async <DefaultUser extends User = User>({
    ctx,
    headers: headersInit,
}: FunctionAPIContext<GetSessionAPIOptions>): Promise<GetSessionAPIReturn<DefaultUser>> => {
    const initHeaders = getInitialHeaders(undefined, headersInit)
    const headers = new HeadersBuilder(initHeaders)
        .setCookie(ctx.cookies.store.sessionToken.name, "", getExpiredCookie(ctx.cookies.store.sessionToken.attributes))
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
        const { session, headers } = await ctx.session.strategy.getSession({
            headers: initHeaders,
        })
        if (!session) return unauthorized
        return {
            session,
            headers,
            success: true,
            toResponse: () => Response.json({ success: true, session }, { headers }),
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
