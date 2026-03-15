import { cacheControl } from "@/headers.ts"
import { AuthInternalError } from "@/errors.ts"
import { HeadersBuilder } from "@aura-stack/router"
import { createAuthorizationURL } from "@/actions/signIn/authorization-url.ts"
import { createRedirectTo, createRedirectURI, createSignInURL, getBaseURL } from "@/actions/signIn/authorization.ts"
import type { BuiltInOAuthProvider, FunctionAPIContext, LiteralUnion, SignInAPIOptions, SignInReturn } from "@/@types/index.ts"

/**
 * Initiates the sign-in flow on the server. Called when the client invokes the `signIn` API route.
 * By default, it redirects to the authorization URL. If the `redirect` option is set to `false`,
 * it returns a JSON response containing the authorization URL, allowing the client to handle redirection.
 * @example
 * const response = await api.signIn("github", {
 *   redirect: true,
 *   headers: await getAuthHeaders(),
 * })
 */
export const signIn = async <Redirect extends boolean = true>(
    oauth: LiteralUnion<BuiltInOAuthProvider>,
    { ctx, headers: headersInit, redirectTo, redirect, request: requestInit }: FunctionAPIContext<SignInAPIOptions<Redirect>>
): Promise<SignInReturn<Redirect>> => {
    const headers = new Headers(headersInit)
    const provider = ctx.oauth[oauth]
    if (!provider) {
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", `The OAuth provider "${oauth}" is not configured.`)
    }

    let request = requestInit
    if (!request) {
        const origin = await getBaseURL({ ctx: ctx, headers })
        const url = `${origin}${ctx.basePath}/signIn/${oauth}`
        request = new Request(url, { headers })
    }

    if (redirect === false) {
        const signInURL = await createSignInURL({ request, oauth, ctx, redirectTo })
        return { redirect: false, signInURL } as unknown as SignInReturn<Redirect>
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

    return Response.json(
        { redirect: redirect ?? true, signInURL: authorization },
        {
            status: (redirect ?? true) ? 302 : 200,
            headers: headersList,
        }
    ) as unknown as SignInReturn<Redirect>
}
