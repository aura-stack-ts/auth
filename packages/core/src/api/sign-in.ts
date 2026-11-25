import { toAPIResponse } from "@/shared/utils/to-api-response.ts"
import { createSignInURL } from "@/shared/oauth2/authorization.ts"
import { errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import { getAuraAuthHeaders, secureApiHeaders } from "@/shared/http/headers.ts"
import { createValidation } from "@/shared/utils/create-validation.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, LiteralUnion, SignInAPIOptions, SignInAPIReturn } from "@/@types/index.ts"

/**
 * Initiates the sign-in flow on the server. Called when the client invokes the `signIn` API function.
 */
export const signIn = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    context: FunctionAPIContext<SignInAPIOptions>
): Promise<SignInAPIReturn> => {
    const initHeaders = new Headers(secureApiHeaders)
    try {
        const { request, rateLimit, provider, cookieStore } = await createValidation(context)
            .verifyOAuthProvider(oauthId)
            .buildRequest(`/signIn/${oauthId}`)
            .verifyRateLimit("signIn")
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as SignInAPIReturn
        }

        if (context.redirect === false) {
            context.ctx?.logger?.log("SIGN_IN_INITIATED", {
                structuredData: { oauth_provider: oauthId },
            })
            const signInURL = await createSignInURL({ request, oauth: oauthId, ctx: context.ctx, redirectTo: context.redirectTo })
            return toAPIResponse<SignInAPIReturn>({
                success: true,
                redirect: false,
                signInURL,
                headers: initHeaders,
            })
        }

        const { success, signInURL, headers } = await context.ctx.session.strategy.signIn({
            oauthId,
            provider,
            request,
            redirectTo: context.redirectTo,
            cookieStore,
            headers: initHeaders,
        })

        return toAPIResponse<SignInAPIReturn>({
            success,
            redirect: true,
            signInURL,
            headers,
            status: 302,
        })
    } catch (error) {
        errorToLogMessage(error, "AUTH_SIGN_IN_FAILED", context.ctx.logger)
        const { errors } = handleApiError(error, "AUTH_SIGN_IN_FAILED", "An error occurred during the sign-in process.")
        const headers = getAuraAuthHeaders(error, initHeaders)

        return toAPIResponse<SignInAPIReturn>({
            success: false,
            redirect: false,
            signInURL: null,
            error: errors,
            headers,
            status: 500,
        })
    }
}
