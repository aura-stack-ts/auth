import { HeadersBuilder } from "@aura-stack/router"
import { cacheControl } from "@/shared/http/headers.ts"
import { createOIDCAuthorizationURL } from "@/shared/oidc/authorization-url.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAuthorizationURL, createRedirectTo, createRedirectURI } from "@/shared/oauth2/authorization.ts"
import type { InternalStatelessContext, SessionStrategy } from "@/@types/internal.ts"

export const signIn = ({ ctx }: InternalStatelessContext): SessionStrategy["signIn"] => {
    const { logger } = ctx

    return async ({ oauthId, provider, request, redirectTo }) => {
        const redirectURI = await createRedirectURI(request, oauthId, ctx)
        const redirectToValue = await createRedirectTo(request, redirectTo, ctx)

        const isOIDC = isOIDCProvider(provider)
        logger?.log("SIGN_IN_PROVIDER_TYPE_DETECTED", {
            structuredData: { oauth_provider: oauthId, oidc: isOIDC },
        })

        const resolvedProvider = isOIDC ? await resolveOpenIDProvider(provider!) : provider!

        if (isOIDC) {
            logger?.log("OIDC_PROVIDER_RESOLVED", {
                structuredData: { oauth_provider: oauthId, oidc: isOIDC },
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

        logger?.log("SIGN_IN_INITIATED", {
            structuredData: { oauth_provider: oauthId, oidc: isOIDC },
        })

        const headersBuilder = new HeadersBuilder(cacheControl)
            .setHeader("Location", authorization)
            .setCookie(ctx.cookies.store.state.name, state, ctx.cookies.store.state.attributes)
            .setCookie(ctx.cookies.store.redirectURI.name, redirectURI, ctx.cookies.store.redirectURI.attributes)
            .setCookie(ctx.cookies.store.redirectTo.name, redirectToValue, ctx.cookies.store.redirectTo.attributes)
            .setCookie(ctx.cookies.store.codeVerifier.name, codeVerifier, ctx.cookies.store.codeVerifier.attributes)

        if (nonce) {
            headersBuilder.setCookie(ctx.cookies.store.nonce.name, nonce, ctx.cookies.store.nonce.attributes)
        }
        return {
            success: true,
            signInURL: authorization,
            headers: headersBuilder.toHeaders(),
        }
    }
}
