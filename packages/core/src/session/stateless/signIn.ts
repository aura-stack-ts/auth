import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/shared/errors.ts"
import { cacheControl } from "@/shared/headers.ts"
import { createOIDCAuthorizationURL } from "@/shared/oidc/authorization-url.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAuthorizationURL, createRedirectTo, createRedirectURI } from "@/shared/utils/authorization.ts"
import type { InternalStatelessContext } from "@/@types/session.ts"

export const __signIn = ({ ctx, cookies }: InternalStatelessContext) => {
    const { oauth, logger } = ctx

    return async (oauthId: string, request: Request, redirectTo?: string) => {
        const provider = oauth[oauthId]
        if (!provider) {
            throw new AuraAuthError({ code: "UNSUPPORTED_OAUTH_CONFIGURATION" })
        }

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
            .setCookie(cookies().state.name, state, cookies().state.attributes)
            .setCookie(cookies().redirectURI.name, redirectURI, cookies().redirectURI.attributes)
            .setCookie(cookies().redirectTo.name, redirectToValue, cookies().redirectTo.attributes)
            .setCookie(cookies().codeVerifier.name, codeVerifier, cookies().codeVerifier.attributes)

        if (nonce) {
            headersBuilder.setCookie(cookies().nonce.name, nonce, cookies().nonce.attributes)
        }
        return {
            success: true,
            signInURL: authorization,
            headers: headersBuilder.toHeaders(),
        }
    }
}
