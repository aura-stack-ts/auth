import { parse, parseSetCookie, serialize, type SerializeOptions } from "cookie"
import { AuthError } from "@/error.js"
import type { JWTPayload } from "@/jose.js"
import type { AuthRuntimeConfig, CookieName, LiteralUnion, CookieStoreConfig, CookieConfig } from "@/@types/index.js"

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
    httpOnly: true
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

/**
 * Expire a cookie by setting its value to an empty string and applying expired cookie options.
 *
 * @param name The name of the cookie to expire
 * @param options cookie options obtained from secureCookieOptions
 * @returns formatted cookie options for an expired cookie
 */
export const expiresCookie = (name: LiteralUnion<CookieName>) => {
    return setCookie(name, "", {
        expires: new Date(0),
        maxAge: 0,
    })
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
        throw new AuthError("invalid_request", "No cookies found. There is no active session")
    }
    const value = parse(cookies)[cookieName]
    if (!value) {
        throw new AuthError("invalid_request", `Cookie "${cookieName}" not found. There is no active session`)
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
        throw new AuthError("invalid_request", "No cookies found in response.")
    }
    const strCookie = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`))
    if (!strCookie) {
        throw new AuthError("invalid_request", `Cookie "${cookieName}" not found in response.`)
    }
    return parseSetCookie(strCookie).value
}

/**
 * Create a session cookie containing a signed and encrypted JWT, using the
 * `@aura-stack/jose` package for the encoding.
 *
 * @param session - The JWT payload to be encoded in the session cookie
 * @returns The serialized session cookie string
 */
export const createSessionCookie = async (
    session: JWTPayload,
    cookieName: string,
    attributes: SerializeOptions,
    jose: AuthRuntimeConfig["jose"]
) => {
    try {
        const encoded = await jose.encodeJWT(session)
        return setCookie(cookieName, encoded, attributes)
    } catch (error) {
        // @ts-ignore
        throw new AuthError("server_error", "Failed to create session cookie", { cause: error })
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
    strategy: "host" | "secure" | "standard"
): SerializeOptions => {
    if (!attributes.httpOnly) {
        console.warn(
            "[WARNING]: Cookie is configured without HttpOnly. This allows JavaScript access via document.cookie and increases XSS risk."
        )
    }
    if (attributes.domain === "*") {
        attributes.domain = undefined
        console.warn("[WARNING]: Cookie 'Domain' is set to '*', which is insecure. Avoid wildcard domains.")
    } 
    if (!useSecure) {
        if (attributes.secure) {
            console.warn(
                "[WARNING]: The 'Secure' attribute will be disabled for this cookie. Serve over HTTPS to enforce Secure cookies."
            )
        }
        if (attributes.sameSite == "none") {
            attributes.sameSite = "lax"
            console.warn("[WARNING]: SameSite=None requires Secure attribute. Changing SameSite to 'Lax'.")
        }
        if (process.env.NODE_ENV === "production") {
            console.warn("[WARNING]: In production, ensure cookies are served over HTTPS to maintain security.")
        }
        if(strategy === "host") {
            console.warn("[WARNING]: __Host- cookies require a secure context. Falling back to standard cookie settings.")
        }
        return {
            ...defaultCookieOptions,
            ...attributes,
            ...defaultStandardCookieConfig

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
    overrides?: CookieConfig["overrides"]
): CookieStoreConfig => {
    prefix ??= COOKIE_NAME
    const securePrefix = useSecure ? "__Secure-" : ""
    const hostPrefix = useSecure ? "__Host-" : ""
    return {
        sessionToken: {
            name: `${securePrefix}${prefix}.${overrides?.sessionToken?.name ?? "sessionToken"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...defaultCookieOptions,
                    ...overrides?.sessionToken?.attributes,
                },
                overrides?.sessionToken?.attributes?.strategy ?? "secure"
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
                overrides?.state?.attributes?.strategy ?? "secure"
            ),
        },
        csrfToken: {
            name: `${hostPrefix}${prefix}.${overrides?.csrfToken?.name ?? "csrfToken"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...overrides?.csrfToken?.attributes,
                    ...defaultHostCookieConfig
                },                
                overrides?.csrfToken?.attributes?.strategy ?? "host"
            ),
        },
        redirect_to: {
            name: `${securePrefix}${prefix}.${overrides?.redirect_to?.name ?? "redirect_to"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.redirect_to?.attributes,
                },
                overrides?.redirect_to?.attributes?.strategy ?? "secure"
            ),
        },
        redirect_uri: {
            name: `${securePrefix}${prefix}.${overrides?.redirect_uri?.name ?? "redirect_uri"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.redirect_uri?.attributes,
                },
                overrides?.redirect_uri?.attributes?.strategy ?? "secure"
            ),
        },
        code_verifier: {
            name: `${securePrefix}${prefix}.${overrides?.code_verifier?.name ?? "code_verifier"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...overrides?.code_verifier?.attributes,
                },
                overrides?.code_verifier?.attributes?.strategy ?? "secure"
            ),
        },
    }
}
