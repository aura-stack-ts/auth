import { getCookie } from "@/cookie.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import type { LiteralUnion } from "@/@types/utility.ts"
import type { BuiltInOAuthProvider } from "@/oauth/index.ts"
import type { FunctionAPIContext, ProviderConnectedAPIOptions, ProviderConnectedAPIReturn } from "@/@types/api.ts"

export const isProviderConnected = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, request: requestInit }: FunctionAPIContext<ProviderConnectedAPIOptions>
): Promise<ProviderConnectedAPIReturn> => {
    const { cookies, jwtManager } = ctx
    try {
        ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
            structuredData: { provider: oauth, operation: "check_connection" },
        })

        const { headers, request } = await createValidation(ctx, headersInit ?? requestInit?.headers)
            .verifyOAuthProvider(oauth)
            .verifySession()
            .buildRequest(requestInit, `/providers/${oauth}`)
            .execute()

        const cookieName = `${cookies.accessToken.name}.${oauth}`
        let cookieValue: string
        try {
            cookieValue = getCookie(request, cookieName)
        } catch {
            ctx.logger?.log("OAUTH_ACCESS_TOKEN_REQUEST_INITIATED", {
                structuredData: { provider: oauth, hasCookie: false },
            })
            return {
                success: true,
                connected: false,
                headers,
                toResponse: () => Response.json({ success: true, connected: false }, { status: 200, headers }),
            }
        }

        const decodedToken = await jwtManager.verifyToken(cookieValue)
        const connected = !!decodedToken

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_SUCCESS", {
            structuredData: { provider: oauth, connected },
        })

        return {
            success: true,
            connected,
            headers,
            toResponse: () => Response.json({ success: true, connected }, { status: 200, headers }),
        }
    } catch (error) {
        const { code, message, statusCode } = handleApiError(error, "OAUTH_PROVIDER_CONNECTED_ERROR", "")

        ctx.logger?.log("OAUTH_ACCESS_TOKEN_ERROR", {
            structuredData: { provider: oauth, code, errorType: error?.constructor?.name ?? "Unknown" },
        })

        const headers = new Headers(secureApiHeaders)
        return {
            success: false,
            connected: false,
            error: { code, message },
            headers,
            toResponse: () => {
                return Response.json({ success: false, connected: false }, { status: statusCode, headers })
            },
        }
    }
}
