import { HeadersBuilder } from "@aura-stack/router"
import { AuraAuthError } from "@/shared/errors.ts"
import { secureApiHeaders } from "@/shared/headers.ts"
import { createFingerprint, getDeviceInfo } from "@/shared/utils.ts"
import { createDevice as __createDevice } from "@/session/stateful/utils.ts"
import { createOIDCAuthorizationURL } from "@/shared/oidc/authorization-url.ts"
import { isOIDCProvider, resolveOpenIDProvider } from "@/shared/oidc/resolve-provider.ts"
import { createAuthorizationURL, createRedirectTo, createRedirectURI } from "@/shared/utils/authorization.ts"
import type { InternalStatefulContext } from "@/@types/session.ts"

export const __signIn = ({ ctx }: InternalStatefulContext) => {
    const { logger, oauth, sessionConfig } = ctx

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

        const resolvedProvider = isOIDC ? await resolveOpenIDProvider(provider) : provider

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

        const { userAgent } = getDeviceInfo(request)
        const fingerprint = await createFingerprint(request)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await sessionConfig.adapter.createOAuthTransaction({
            id: crypto.randomUUID(),
            provider: oauthId,
            state,
            nonce: nonce || null,
            codeVerifier,
            redirectURI: redirectURI,
            redirectTo: redirectToValue,
            userAgent,
            fingerprint,
            createdAt: new Date(),
            expiresAt,
            deviceId: null,
            metadata: null,
        })

        const headers = new HeadersBuilder(secureApiHeaders).setHeader("Location", authorization).toHeaders()

        return {
            success: true,
            signInURL: authorization,
            headers,
        }
    }
}
