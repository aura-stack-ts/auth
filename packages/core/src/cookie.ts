import { parse, parseSetCookie, serialize, type SerializeOptions } from "@aura-stack/router/cookie"
import { AuthInternalError } from "@/errors.js"
import type { JWTPayload } from "@/jose.js"
import type { AuthRuntimeConfig, CookieStoreConfig, CookieConfig, Logger } from "@/@types/index.js"

/**
 * Prefix for all cookies set by Aura Auth.
 */
export const COOKIE_NAME = "aura-auth"

/**
 * Default cookie options used by Aura Auth.
 */
export const defaultCookieOptions: SerializeOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 15,
}

export const defaultStandardCookieConfig: SerializeOptions = {
    secure: false,
    httpOnly: true,
}

/**
 * Default cookie options for "__Secure-" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
export const defaultSecureCookieConfig: SerializeOptions = {
    secure: true,
    httpOnly: true,
}

/**
 * Default cookie options for "__Host-" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
export const defaultHostCookieConfig: SerializeOptions = {
    secure: true,
    httpOnly: true,
    path: "/",
    domain: undefined,
}

/**
 * Set OAuth-specific cookie options, including a short maxAge of 5 minutes.
 */
const oauthCookieOptions: SerializeOptions = {
    httpOnly: true,
    maxAge: 5 * 60,
    sameSite: "lax",
    expires: new Date(Date.now() + 5 * 60 * 1000),
}

/**
 * Set a cookie with the given name, value and `SerializeOptions`; supports secure
 * cookies with the `__Secure-` and `__Host-` prefixes.
 *
 * Cookie attributes are serialized in the following order:
 * Expires, Max-Age, Domain, Path, Secure, HttpOnly, SameSite, Partitioned, Priority.
 */
export const setCookie = (cookieName: string, value: string, options?: SerializeOptions) => {
    return serialize(cookieName, value, options)
}

export const expiredCookieAttributes: SerializeOptions = {
    ...defaultCookieOptions,
    expires: new Date(0),
    maxAge: 0,
}

/**
 * Get a cookie by name from the request.
 *
 * @param request The incoming request object
 * @param cookie Cookie name to retrieve
 * @returns The value of the cookie or throw an error if not found
 */
export const getCookie = (request: Request, cookieName: string) => {
    const cookies = request.headers.get("Cookie")
    if (!cookies) {
        throw new AuthInternalError("COOKIE_NOT_FOUND", "No cookies found. There is no active session")
    }
    const value = parse(cookies)[cookieName]
    if (!value) {
        throw new AuthInternalError("COOKIE_NOT_FOUND", `Cookie "${cookieName}" not found. There is no active session`)
    }
    return value
}

/**
 * Get a Set-Cookie header value by cookie name from the response.
 *
 * @param response The response object
 * @param cookieName Cookie name to retrieve
 * @returns The value of the Set-Cookie header or throw an error if not found
 */
export const getSetCookie = (response: Response, cookieName: string) => {
    const cookies = response.headers.getSetCookie()
    if (!cookies) {
        throw new AuthInternalError("COOKIE_NOT_FOUND", "No cookies found in response.")
    }
    const strCookie = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`))
    if (!strCookie) {
        throw new AuthInternalError("COOKIE_NOT_FOUND", `Cookie "${cookieName}" not found in response.`)
    }
    return parseSetCookie(strCookie).value
}

/**
 * Create a session cookie containing a signed and encrypted JWT, using the
 * `@aura-stack/jose` package for the encoding.
 *
 * @param jose - Jose Instance
 * @param session - The JWT payload to be encoded in the session cookie
 * @returns The serialized session cookie string
 */
export const createSessionCookie = async (jose: AuthRuntimeConfig["jose"], session: JWTPayload) => {
    try {
        const encoded = await jose.encodeJWT(session)
        return encoded
    } catch (error) {
        throw new AuthInternalError("INVALID_JWT_TOKEN", "Failed to create session cookie", { cause: error })
    }
}

/**
 * Defines the cookie configuration based on the request security and cookie options passed
 * in the Aura Auth configuration (`createAuth` function). This function ensures the correct
 * cookie prefixes and security attributes are applied based on whether the request is secure
 * (HTTPS) or not.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Forwarded-Proto
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Forwarded
 * @param useSecure Whether the request is secure (HTTPS)
 * @param attributes The cookie attributes to be applied
 * @param strategy The cookie strategy: "host", "secure", or "standard"
 * @returns The finalized cookie options to be used for setting cookies
 */
export const defineSecureCookieOptions = (
    useSecure: boolean,
    attributes: SerializeOptions,
    strategy: "host" | "secure" | "standard",
    logger?: Logger
): SerializeOptions => {
    if (!attributes.httpOnly) {
        logger?.log({
            facility: 10,
            severity: "critical",
            timestamp: new Date().toISOString(),
            hostname: "aura-auth",
            appName: "aura-auth",
            msgId: "COOKIE_HTTPONLY_DISABLED",
            message:
                "Cookie is configured without HttpOnly. This allows JavaScript access via document.cookie and increases XSS risk.",
        })
    }
    if (attributes.domain === "*") {
        attributes.domain = undefined
        logger?.log({
            facility: 10,
            severity: "critical",
            timestamp: new Date().toISOString(),
            hostname: "aura-auth",
            appName: "aura-auth",
            msgId: "COOKIE_WILDCARD_DOMAIN",
            message: "Cookie 'Domain' is set to '*', which is insecure. Avoid wildcard domains.",
        })
    }
    if (!useSecure) {
        if (attributes.secure) {
            logger?.log({
                facility: 10,
                severity: "warning",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "COOKIE_SECURE_DISABLED",
                message:
                    "Cookie is configured with 'Secure' attribute, but the request is not secure (HTTPS). 'Secure' will be disabled.",
            })
        }
        if (attributes.sameSite == "none") {
            attributes.sameSite = "lax"
            logger?.log({
                facility: 10,
                severity: "warning",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "COOKIE_SAMESITE_NONE_WITHOUT_SECURE",
                message: "Cookie is configured with SameSite=None but without Secure attribute. Changing SameSite to 'Lax'.",
            })
        }
        if (process.env.NODE_ENV === "production") {
            logger?.log({
                facility: 10,
                severity: "critical",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "COOKIE_INSECURE_IN_PRODUCTION",
                message: "Cookies are being served over an insecure connection in production. This poses security risks.",
            })
        }
        if (strategy === "host") {
            logger?.log({
                facility: 10,
                severity: "critical",
                timestamp: new Date().toISOString(),
                hostname: "aura-auth",
                appName: "aura-auth",
                msgId: "COOKIE_HOST_STRATEGY_INSECURE",
                message: "__Host- cookies require a secure context. Falling back to standard cookie settings.",
            })
        }
        return {
            ...defaultCookieOptions,
            ...attributes,
            ...defaultStandardCookieConfig,
        }
    }
    return strategy === "host"
        ? {
              ...defaultCookieOptions,
              ...attributes,
              ...defaultHostCookieConfig,
          }
        : { ...defaultCookieOptions, ...attributes, ...defaultSecureCookieConfig }
}

/**
 * @param useSecure Whether the request is secure (HTTPS)
 * @param prefix Optional prefix added to all cookie names
 * @param overrides Optional overrides for individual cookie configurations
 * @returns The complete cookie store configuration
 */
export const createCookieStore = (
    useSecure: boolean,
    prefix?: string,
    overrides?: CookieConfig["overrides"],
    logger?: Logger
): CookieStoreConfig => {
    prefix ??= COOKIE_NAME
    const securePrefix = useSecure ? "__Secure-" : ""
    const hostPrefix = useSecure ? "__Host-" : ""
    return {
        sessionToken: {
            name: `${securePrefix}${prefix}.${overrides?.sessionToken?.name ?? "session_token"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...defaultCookieOptions,
                    ...overrides?.sessionToken?.attributes,
                },
                overrides?.sessionToken?.attributes?.strategy ?? "secure",
                logger
            ),
        },
        state: {
            name: `${securePrefix}${prefix}.${overrides?.state?.name ?? "state"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.state?.attributes,
                },
                overrides?.state?.attributes?.strategy ?? "secure",
                logger
            ),
        },
        csrfToken: {
            name: `${hostPrefix}${prefix}.${overrides?.csrfToken?.name ?? "csrf_token"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...overrides?.csrfToken?.attributes,
                    ...defaultHostCookieConfig,
                },
                overrides?.csrfToken?.attributes?.strategy ?? "host",
                logger
            ),
        },
        redirectTo: {
            name: `${securePrefix}${prefix}.${overrides?.redirectTo?.name ?? "redirect_to"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.redirectTo?.attributes,
                },
                overrides?.redirectTo?.attributes?.strategy ?? "secure",
                logger
            ),
        },
        redirectURI: {
            name: `${securePrefix}${prefix}.${overrides?.redirectURI?.name ?? "redirect_uri"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.redirectURI?.attributes,
                },
                overrides?.redirectURI?.attributes?.strategy ?? "secure",
                logger
            ),
        },
        codeVerifier: {
            name: `${securePrefix}${prefix}.${overrides?.codeVerifier?.name ?? "code_verifier"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.codeVerifier?.attributes,
                },
                overrides?.codeVerifier?.attributes?.strategy ?? "secure",
                logger
            ),
        },
    }
}
