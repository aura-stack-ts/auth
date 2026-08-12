import { getProviderTokens } from "@/api/getProviderTokens.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { AccessTokenAPIOptions, AccessTokenAPIReturn, LiteralUnion, BuiltInOAuthProvider } from "@/@types/index.ts"

export const getAccessToken = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    ctx: FunctionAPIContext<AccessTokenAPIOptions>
): Promise<AccessTokenAPIReturn> => {
    try {
        const output = await getProviderTokens(oauth, ctx)
        const accessToken = output.success ? output.tokens.accessToken : null

        if (!output.success) {
            const statusCode = output.toResponse().status
            return {
                success: false,
                accessToken,
                error: output.error,
                headers: output.headers,
                toResponse: () => Response.json({ success: false, accessToken }, { status: statusCode, headers: output.headers }),
            } as AccessTokenAPIReturn
        }
        return {
            success: true,
            accessToken,
            headers: output.headers,
            toResponse: () => Response.json({ success: true, accessToken }, { status: 200, headers: output.headers }),
        } as AccessTokenAPIReturn
    } catch (error) {
        errorToLogMessage(error, "ACCESS_TOKEN_ERROR", ctx.ctx.logger)
        const { errors } = handleApiError(error, "ACCESS_TOKEN_ERROR", "Failed to get access token")
        return {
            success: false,
            accessToken: null,
            error: errors,
            headers: new Headers(),
            toResponse: () => Response.json({ success: false, accessToken: null }, { status: 500, headers: new Headers() }),
        }
    }
}
