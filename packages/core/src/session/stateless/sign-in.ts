import { HeadersBuilder } from "@aura-stack/router"
import { createRedirectTo } from "@/shared/utils/create-redirect-to.ts"
import { createOIDCAuthorizationURL } from "@/shared/oidc/authorization-url.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAuthorizationURL, createRedirectURI } from "@/shared/oauth2/authorization-url.ts"
import type { InternalContextForStateless, SessionStrategy } from "@/@types/internal.ts"

export const signIn = (ctx: InternalContextForStateless): SessionStrategy["signIn"] => {
    const { logger } = ctx

    return async ({ oauthId, provider, request, headers, redirectTo, cookieStore }) => {
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

        const headersBuilder = new HeadersBuilder(headers)
            .setHeader("Location", authorization)
            .setCookie(cookieStore.state.name, state, cookieStore.state.attributes)
            .setCookie(cookieStore.redirectURI.name, redirectURI, cookieStore.redirectURI.attributes)
            .setCookie(cookieStore.redirectTo.name, redirectToValue, cookieStore.redirectTo.attributes)
            .setCookie(cookieStore.codeVerifier.name, codeVerifier, cookieStore.codeVerifier.attributes)

        if (nonce) {
            headersBuilder.setCookie(cookieStore.nonce.name, nonce, cookieStore.nonce.attributes)
        }
        return {
            success: true,
            signInURL: authorization,
            headers: headersBuilder.toHeaders(),
        }
    }
}
