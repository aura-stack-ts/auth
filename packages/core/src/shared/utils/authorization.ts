import { getEnv } from "@/shared/env.ts"
import { OAuthAuthorization } from "@/schemas.ts"
import { AuraAuthError } from "@/shared/errors.ts"
import { createPKCE, createSecretValue } from "@/shared/crypto.ts"
import { equals, extractPath, patternToRegex } from "@/shared/utils.ts"
import { isRelativeURL, isSameOrigin, isValidURL, isTrustedOrigin } from "@/shared/assert.ts"
import type { GlobalContext } from "@aura-stack/router"
import type { AuthConfig, OAuthProvider } from "@/@types/index.ts"
import type { Identities, SchemaTypes } from "@/identity/index.ts"

/**
 * Resolves trusted origins from config (array or function).
 */
export const getTrustedOrigins = async (
    request: Request,
    trustedOrigins: AuthConfig<Identities, SchemaTypes>["trustedOrigins"]
): Promise<string[]> => {
    if (!trustedOrigins) return []
    const raw = typeof trustedOrigins === "function" ? await trustedOrigins(request) : trustedOrigins
    return Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : []
}

export const getBaseURL = async ({
    ctx,
    request,
    headers: headersInit,
}: {
    ctx?: GlobalContext
    request?: Request
    headers?: HeadersInit
}) => {
    const origin = getEnv("BASE_URL") || ctx?.baseURL
    if (origin && origin !== "/") return origin
    if (ctx?.trustedProxyHeaders) {
        const headers = (headersInit && new Headers(headersInit)) || request?.headers
        const protocol = headers?.get("Forwarded")?.match(/proto=([^;]+)/i)?.[1] ?? headers?.get("X-Forwarded-Proto") ?? "http"
        const host =
            headers?.get("Host") ??
            headers?.get("Forwarded")?.match(/host=([^;]+)/i)?.[1] ??
            headers?.get("X-Forwarded-Host") ??
            null
        if (host) return `${protocol}://${host}`
        throw new AuraAuthError({ code: "INVALID_AUTH_CONFIGURATION" })
    }
    try {
        return new URL(request?.url ?? "not-found").origin
    } catch (cause) {
        throw new AuraAuthError({ code: "INVALID_AUTH_CONFIGURATION", cause })
    }
}

export const getOriginURL = async (request: Request, context?: GlobalContext) => {
    const trustedOrigins = [...(await getTrustedOrigins(request, context?.trustedOrigins))]
    if (!context?.trustedProxyHeaders) {
        const requestOrigin = new URL(request.url).origin
        if (!trustedOrigins.includes(requestOrigin)) trustedOrigins.push(requestOrigin)
    }
    const origin = await getBaseURL({ request, ctx: context })
    if (!isTrustedOrigin(origin, trustedOrigins)) {
        context?.logger?.log("UNTRUSTED_ORIGIN", { structuredData: { origin: origin } })
        throw new AuraAuthError({ code: "INVALID_TRUSTED_ORIGIN" })
    }
    return origin
}

/**
 * Creates the redirect URI for the OAuth callback based on the original request URL and the OAuth provider.
 *
 * @param requestURL - the original request URL
 * @param oauth - OAuth provider name
 * @param context - Global context containing configuration and utilities
 * @returns The redirect URI for the OAuth callback.
 */
export const createRedirectURI = async (request: Request, oauth: string, context: GlobalContext) => {
    const origin = await getOriginURL(request, context)
    return `${origin}${context.basePath}/callback/${oauth}`
}

export const createSignInURL = async ({
    request,
    oauth,
    ctx,
    redirectTo,
}: {
    request: Request
    oauth: string
    ctx: GlobalContext
    redirectTo?: string
}) => {
    const origin = await getOriginURL(request, ctx)
    const searchParams = new URLSearchParams()
    if (redirectTo !== undefined) searchParams.set("redirectTo", String(redirectTo))
    return `${origin}${ctx.basePath}/signIn/${oauth}?${searchParams.toString()}`
}

/**
 * Verifies if the request's origin matches the expected origin. It accepts the redirectTo search
 * parameter for redirection. It checks the Referer and Origin headers and the request URL against
 * the trusted origins list. If they do not match, it returns "/" to avoid potential open redirect attacks.
 *
 * When `trustedOrigins` is provided, URLs are validated against that list. When not provided,
 * the request's derived origin (from request.url or proxy headers) is used as the only trusted origin.
 *
 * @param request The incoming request object
 * @param redirectTo Optional redirectTo parameter to override the referer
 * @param context Global context containing configuration and utilities
 * @returns A safe URL to redirect to after authentication, or "/" if the URL is not considered safe.
 */
export const createRedirectTo = async (request: Request, redirectTo?: string, context?: GlobalContext) => {
    try {
        const headers = request.headers
        const requestOrigin = await getOriginURL(request, context)
        const origins = await getTrustedOrigins(request, context?.trustedOrigins)

        const validateURL = (url: string): string => {
            if (!isRelativeURL(url) && !isValidURL(url)) return "/"
            if (isRelativeURL(url)) return url

            if (origins.length > 0) {
                if (isTrustedOrigin(url, origins)) {
                    const urlOrigin = new URL(url).origin
                    for (const pattern of origins) {
                        const regex = patternToRegex(pattern)
                        if (regex?.test(urlOrigin)) {
                            return isSameOrigin(url, request.url) ? extractPath(url) : url
                        }
                        if (isValidURL(pattern) && equals(new URL(pattern).origin, urlOrigin)) return url
                    }
                }
                context?.logger?.log("OPEN_REDIRECT_ATTACK")
                return "/"
            }
            if (isSameOrigin(url, requestOrigin)) {
                return extractPath(url)
            }
            context?.logger?.log("OPEN_REDIRECT_ATTACK")
            return "/"
        }
        return validateURL(redirectTo ?? headers.get("Referer") ?? headers.get("Origin") ?? "/")
    } catch {
        context?.logger?.log("POTENTIAL_OPEN_REDIRECT_ATTACK_DETECTED")
        return "/"
    }
}

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
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_URL_CONFIG" })
    }
    let url: URL
    try {
        url = new URL(baseURL)
    } catch (cause) {
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_URL_CONFIG", cause })
    }
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
        throw new AuraAuthError({ code: "INVALID_OAUTH_PROVIDER_SCHEMA_CONFIG" })
    }

    return {
        authorization,
        state,
        codeVerifier,
        method,
    }
}
