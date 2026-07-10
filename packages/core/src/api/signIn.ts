import { cacheControl, secureApiHeaders } from "@/shared/headers.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { createAuthorizationURL } from "@/actions/signIn/authorization-url.ts"
import { createOIDCAuthorizationURL } from "@/actions/oidc/authorization-url.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/actions/oidc/resolve-provider.ts"
import { createRedirectTo, createRedirectURI, createSignInURL } from "@/actions/signIn/authorization.ts"
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
        const { provider, request, rateLimit } = await createValidation(ctx, headersInit)
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

        const redirectURI = await createRedirectURI(request, oauth, ctx)
        const redirectToValue = await createRedirectTo(request, redirectTo, ctx)

        const isOIDC = isOIDCProvider(provider!)
        ctx.logger?.log("SIGN_IN_PROVIDER_TYPE_DETECTED", {
            structuredData: { oauth_provider: oauth, oidc: isOIDC },
        })

        const resolvedProvider = isOIDC ? await resolveOpenIDProvider(provider!) : provider!

        if (isOIDC) {
            ctx.logger?.log("OIDC_PROVIDER_RESOLVED", {
                structuredData: { oauth_provider: oauth, oidc: isOIDC },
            })
        }

        let authorization: string
        let state: string
        let codeVerifier: string
        let nonce: string | undefined

        if (isOIDC) {
            const result = await createOIDCAuthorizationURL(resolvedProvider, redirectURI, ctx)
            authorization = result.authorization
            state = result.state
            codeVerifier = result.codeVerifier
            nonce = result.nonce
        } else {
            const result = await createAuthorizationURL(resolvedProvider, redirectURI, ctx)
            authorization = result.authorization
            state = result.state
            codeVerifier = result.codeVerifier
        }

        ctx?.logger?.log("SIGN_IN_INITIATED", {
            structuredData: { oauth_provider: oauth, oidc: isOIDC },
        })

        const headersBuilder = new HeadersBuilder(cacheControl)
            .setHeader("Location", authorization)
            .setCookie(ctx.cookies.state.name, state, ctx.cookies.state.attributes)
            .setCookie(ctx.cookies.redirectURI.name, redirectURI, ctx.cookies.redirectURI.attributes)
            .setCookie(ctx.cookies.redirectTo.name, redirectToValue, ctx.cookies.redirectTo.attributes)
            .setCookie(ctx.cookies.codeVerifier.name, codeVerifier, ctx.cookies.codeVerifier.attributes)

        if (nonce) {
            headersBuilder.setCookie(ctx.cookies.nonce.name, nonce, ctx.cookies.nonce.attributes)
        }

        const headersList = headersBuilder.toHeaders()
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
