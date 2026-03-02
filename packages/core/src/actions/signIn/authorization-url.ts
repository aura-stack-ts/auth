import { OAuthProvider } from "@/@types/index.ts"
import { AuthInternalError } from "@/errors.ts"
import { OAuthAuthorization } from "@/schemas.ts"
import { createPKCE, createSecretValue } from "@/secure.ts"
import type { GlobalContext } from "@aura-stack/router"

export const setSearchParams = (url: URL, params: Record<string, string | undefined>) => {
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== "") {
            url.searchParams.set(key, value)
        }
    }
}

export const buildAuthorizationURL = (
    oauth: OAuthProvider,
    redirect_uri: string,
    state: string,
    code_challenge: string,
    code_challenge_method: string
): string => {
    const authorizeConfig = oauth.authorize
    const baseURL = typeof authorizeConfig === "string" ? authorizeConfig : (authorizeConfig?.url ?? oauth.authorizeURL)
    if (!baseURL) {
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "Missing authorization URL in OAuth provider configuration.")
    }
    const url = new URL(baseURL)
    const authorizeParams = typeof authorizeConfig === "string" ? undefined : authorizeConfig?.params

    setSearchParams(url, {
        response_type: authorizeParams?.responseType ?? oauth.responseType ?? "code",
        client_id: oauth.clientId,
        redirect_uri,
        state,
        code_challenge,
        code_challenge_method,
        scope: authorizeParams?.scope ?? oauth.scope,
        prompt: authorizeParams?.prompt,
        response_mode: authorizeParams?.responseMode,
        login_hint: authorizeParams?.loginHint,
        nonce: authorizeParams?.nonce,
        display: authorizeParams?.display,
        audience: authorizeParams?.audience,
    })
    return url.toString()
}

/**
 * Constructs the request URI for the Authorization Request to the third-party OAuth service. It includes
 * the necessary query parameters such as `client_id`, `redirect_uri`, `response_type`, `scope`, `state`,
 * `code_challenge`, and `code_challenge_method`.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.1
 * @see https://datatracker.ietf.org/doc/html/rfc7636#section-4
 */
export const createAuthorizationURL = async (oauth: OAuthProvider, redirectURI: string, ctx?: GlobalContext) => {
    const state = createSecretValue()
    const { codeVerifier, codeChallenge, method } = await createPKCE()
    const authorization = buildAuthorizationURL(oauth, redirectURI, state, codeChallenge, method)

    const parsed = OAuthAuthorization.safeParse({ ...oauth, redirectURI, state, codeChallenge, codeChallengeMethod: method })
    if (!parsed.success) {
        ctx?.logger?.log("INVALID_OAUTH_CONFIGURATION", {
            structuredData: {
                scope: oauth?.scope ?? "",
                redirect_uri: redirectURI,
                has_state: Boolean(state),
                has_code_challenge: Boolean(codeChallenge),
                code_challenge_method: method,
            },
        })
        throw new AuthInternalError("INVALID_OAUTH_CONFIGURATION", "The OAuth provider configuration is invalid.")
    }

    return {
        authorization,
        state,
        codeVerifier,
        method,
    }
}
