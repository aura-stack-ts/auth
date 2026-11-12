import { getInitialHeaders } from "@/shared/http/headers.ts"
import { createSignInURL } from "@/shared/oauth2/authorization.ts"
import { createValidation, errorToLogMessage, handleApiError } from "@/shared/utils/api.ts"
import type { FunctionAPIContext } from "@/@types/internal.ts"
import type { BuiltInOAuthProvider, LiteralUnion, SignInAPIOptions, SignInAPIReturn } from "@/@types/index.ts"

/**
 * Initiates the sign-in flow on the server. Called when the client invokes the `signIn` API function.
 */
export const signIn = async (
    oauthId: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit, redirect, redirectTo }: FunctionAPIContext<SignInAPIOptions>
): Promise<SignInAPIReturn> => {
    const initHeaders = getInitialHeaders(requestInit, headersInit)
    try {
        const { request, rateLimit, provider } = await createValidation(ctx, initHeaders)
            .verifyOAuthProvider(oauthId)
            .buildRequest(requestInit, `/signIn/${oauthId}`)
            .verifyRateLimit("signIn")
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as SignInAPIReturn
        }

        if (redirect === false) {
            ctx?.logger?.log("SIGN_IN_INITIATED", {
                structuredData: { oauth_provider: oauthId },
            })
            const signInURL = await createSignInURL({ request, oauth: oauthId, ctx, redirectTo })
            return {
                success: true,
                redirect: false,
                signInURL,
                headers: initHeaders,
                toResponse: () => {
                    return Response.json({ success: true, redirect: false, signInURL }, { status: 200, headers: initHeaders })
                },
            }
        }

        const { success, signInURL, headers } = await ctx.session.strategy.signIn({
            oauthId,
            provider,
            request,
            redirectTo,
            headers: initHeaders,
        })

        return {
            success,
            redirect: true,
            signInURL,
            headers,
            toResponse: () => {
                return Response.json({ success, redirect: true, signInURL }, { status: 302, headers })
            },
        } as SignInAPIReturn
    } catch (error) {
        errorToLogMessage(error, "AUTH_SIGN_IN_FAILED", ctx.logger)
        const { errors } = handleApiError(error, "AUTH_SIGN_IN_FAILED", "An error occurred during the sign-in process.")
        return {
            success: false,
            redirect: false,
            signInURL: null,
            error: errors,
            headers: initHeaders,
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        signInURL: null,
                        error: errors,
                    },
                    { status: 500, headers: initHeaders }
                )
            },
        }
    }
}
