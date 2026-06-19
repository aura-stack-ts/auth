import { cacheControl, secureApiHeaders } from "@/shared/headers.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { verifyRateLimit } from "@/router/rate-limiter.ts"
import { AuraAuthError, isAuraAuthError } from "@/shared/errors.ts"
import { createAuthorizationURL } from "@/actions/signIn/authorization-url.ts"
import { createRedirectTo, createRedirectURI, createSignInURL, getBaseURL } from "@/actions/signIn/authorization.ts"
import type { BuiltInOAuthProvider, FunctionAPIContext, LiteralUnion, SignInAPIOptions, SignInAPIReturn } from "@/@types/index.ts"

/**
 * Initiates the sign-in flow on the server. Called when the client invokes the `signIn` API function.
 */
export const signIn = async (
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, request: requestInit, headers: headersInit, redirect, redirectTo }: FunctionAPIContext<SignInAPIOptions>
): Promise<SignInAPIReturn> => {
    try {
        const headers = new Headers(headersInit)
        const provider = ctx.oauth[oauth]
        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

        let request = requestInit
        if (!request) {
            const origin = await getBaseURL({ ctx, headers })
            const url = `${origin}${ctx.basePath}/signIn/${oauth}`
            request = new Request(url, { headers })
        }

        const rateLimit = await verifyRateLimit(ctx, request, "signIn")

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

        const redirectURI = await createRedirectURI(request, oauth, ctx)
        const redirectToValue = await createRedirectTo(request, redirectTo, ctx)
        const { authorization, state, codeVerifier } = await createAuthorizationURL(provider, redirectURI, ctx)

        ctx?.logger?.log("SIGN_IN_INITIATED", {
            structuredData: { oauth_provider: oauth },
        })

        const headersList = new HeadersBuilder(cacheControl)
            .setHeader("Location", authorization)
            .setCookie(ctx.cookies.state.name, state, ctx.cookies.state.attributes)
            .setCookie(ctx.cookies.redirectURI.name, redirectURI, ctx.cookies.redirectURI.attributes)
            .setCookie(ctx.cookies.redirectTo.name, redirectToValue, ctx.cookies.redirectTo.attributes)
            .setCookie(ctx.cookies.codeVerifier.name, codeVerifier, ctx.cookies.codeVerifier.attributes)
            .toHeaders()
        return {
            success: true,
            redirect: true,
            signInURL: authorization,
            headers: headersList,
            toResponse: () => {
                return Response.json(
                    { success: true, redirect: true, signInURL: authorization },
                    { status: 302, headers: headersList }
                )
            },
        }
    } catch (error) {
        let code = "AUTH_SIGN_IN_FAILED"
        let message = "An error occurred during the sign-in process."
        if (isAuraAuthError(error)) {
            code = error.code
            message = error.userMessage
        }
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
