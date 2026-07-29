import { secureApiHeaders } from "@/shared/headers.ts"
import { createSignInURL } from "@/shared/utils/authorization.ts"
import { createValidation, handleApiError } from "@/shared/utils/api.ts"
import type { BuiltInOAuthProvider, FunctionAPIContext, LiteralUnion, SignInAPIOptions, SignInAPIReturn } from "@/@types/index.ts"

/**
 * Initiates the sign-in flow on the server. Called when the client invokes the `signIn` API function.
 */
export const signIn = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit, redirect, redirectTo }: FunctionAPIContext<SignInAPIOptions>
): Promise<SignInAPIReturn> => {
    try {
        const { request, rateLimit } = await createValidation(ctx, headersInit)
            .verifyOAuthProvider(oauth)
            .buildRequest(requestInit, `/signIn/${oauth}`)
            .verifyRateLimit("signIn")
            .execute()

        if (rateLimit) {
            return rateLimit as unknown as SignInAPIReturn
        }

        if (redirect === false) {
            ctx?.logger?.log("SIGN_IN_INITIATED", {
                structuredData: { oauth_provider: oauth },
            })

            const signInURL = await createSignInURL({ request, oauth, ctx, redirectTo })
            const headers = new Headers(secureApiHeaders)
            return {
                success: true,
                redirect: false,
                signInURL,
                headers,
                toResponse: () => {
                    return Response.json({ success: true, redirect: false, signInURL }, { status: 200, headers })
                },
            }
        }

        const { success, signInURL, headers } = await ctx.sessionStrategy.signIn(oauth, request, redirectTo)

        return {
            success,
            redirect: true,
            signInURL: signInURL,
            headers: headers,
            toResponse: () => {
                return Response.json({ success: true, redirect: true, signInURL: signInURL }, { status: 302, headers: headers })
            },
        } as SignInAPIReturn
    } catch (error) {
        const { code, message } = handleApiError(error, "AUTH_SIGN_IN_FAILED", "An error occurred during the sign-in process.")
        return {
            success: false,
            redirect: false,
            signInURL: null,
            error: { code, message },
            headers: new Headers(secureApiHeaders),
            toResponse: () => {
                return Response.json(
                    {
                        success: false,
                        redirect: false,
                        signInURL: null,
                        error: { code, message },
                    },
                    { status: 500, headers: secureApiHeaders }
                )
            },
        }
    }
}
