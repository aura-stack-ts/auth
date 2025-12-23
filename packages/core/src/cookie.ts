import { parse, parseSetCookie, serialize, type SerializeOptions } from "cookie"
import { AuthError } from "@/error.js"
import { isRequest } from "@/assert.js"
import type { JWTPayload } from "@/jose.js"
import type {
    AuthRuntimeConfig,
    CookieName,
    CookieConfig,
    CookieConfigInternal,
    LiteralUnion,
    StandardCookie,
    CookieStoreConfig,
} from "@/@types/index.js"

export { parse } from "cookie"

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

/**
 * Default cookie options for "standard" cookies.
 */
export const defaultCookieConfig: CookieConfig = {
    strategy: "standard",
    name: COOKIE_NAME,
    options: defaultCookieOptions,
}

export const defaultStandardCookieConfig: CookieConfigInternal = {
    secure: false,
    httpOnly: true,
    prefix: "",
}

/**
 * Default cookie options for "secure" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
export const defaultSecureCookieConfig: CookieConfigInternal = {
    secure: true,
    prefix: "__Secure-",
}

/**
 * Default cookie options for "host" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
export const defaultHostCookieConfig: CookieConfigInternal = {
    secure: true,
    prefix: "__Host-",
    path: "/",
    domain: undefined,
}

/**
 * Cookie options for expired cookies.
 */
export const expiredCookieOptions: SerializeOptions = {
    ...defaultCookieOptions,
    expires: new Date(0),
    maxAge: 0,
}

export const defineDefaultCookieOptions = (options?: CookieConfigInternal): CookieConfigInternal => {
    return {
        name: options?.name ?? COOKIE_NAME,
        prefix: options?.prefix ?? (options?.secure ? "__Secure-" : ""),
        ...defaultCookieOptions,
        ...options,
    }
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
 * Get a cookie by name from the request.
 *
 * @deprecated
 * @param request The incoming request object
 * @param cookie Cookie name to retrieve
 * @param options Cookie options to define the prefix and other attributes
 * @param optional If true, returns an empty string instead of throwing an error when the cookie is not found
 * @returns The value of the cookie or undefined if not found
 */
export const getCookie = (
    petition: Request | Response,
    cookie: LiteralUnion<CookieName>,
    options?: CookieConfigInternal,
    optional: boolean = false
) => {
    const cookies = isRequest(petition) ? petition.headers.get("Cookie") : petition.headers.getSetCookie().join("; ")
    if (!cookies) {
        if (optional) {
            return ""
        }
        throw new AuthError("invalid_request", "No cookies found. There is no active session")
    }
    const { name, prefix } = defineDefaultCookieOptions(options)
    const parsedCookies = parse(cookies)
    const value = parsedCookies[`${prefix}${name}.${cookie}`]
    if (value === undefined) {
        if (optional) {
            return ""
        }
        throw new AuthError("invalid_request", `Cookie "${cookie}" not found. There is no active session`)
    }
    return value
}

export const unstable__get_cookie = (request: Request, cookieName: string) => {
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

export const unstable__get_set_cookie = (response: Response, cookieName: string) => {
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
 * @param request The incoming request object
 * @param cookieOptions Cookie options from the Aura Auth configuration
 * @returns The finalized cookie options to be used for setting cookies
 */
export const secureCookieOptions = (
    request: Request,
    cookieOptions: CookieConfig,
    trustedProxyHeaders?: boolean
): CookieConfigInternal => {
    const name = cookieOptions.name ?? COOKIE_NAME
    const isSecure = trustedProxyHeaders
        ? request.url.startsWith("https://") ||
          request.headers.get("X-Forwarded-Proto") === "https" ||
          request.headers.get("Forwarded")?.includes("proto=https")
        : request.url.startsWith("https://")
    if (!cookieOptions.options?.httpOnly) {
        console.warn(
            "[WARNING]: Cookie is configured without HttpOnly. This allows JavaScript access via document.cookie and increases XSS risk."
        )
    }
    if ((cookieOptions.options as StandardCookie["options"])?.domain === "*") {
        console.warn("[WARNING]: Cookie 'Domain' is set to '*', which is insecure. Avoid wildcard domains.")
    }
    if (!isSecure) {
        const options = cookieOptions.options as StandardCookie["options"]
        if (options?.secure) {
            console.warn(
                "[WARNING]: The 'Secure' attribute will be disabled for this cookie. Serve over HTTPS to enforce Secure cookies."
            )
        }
        if (options?.sameSite == "none") {
            console.warn("[WARNING]: SameSite=None without a secure connection can be blocked by browsers.")
        }
        if (process.env.NODE_ENV === "production") {
            console.warn("[WARNING]: In production, ensure cookies are served over HTTPS to maintain security.")
        }
        return {
            ...defaultCookieOptions,
            ...cookieOptions.options,
            sameSite: options?.sameSite === "none" ? "lax" : (options?.sameSite ?? "lax"),
            ...defaultStandardCookieConfig,
            name,
        }
    }
    return cookieOptions.strategy === "host"
        ? {
              ...defaultCookieOptions,
              ...cookieOptions.options,
              ...defaultHostCookieConfig,
              name,
          }
        : { ...defaultCookieOptions, ...cookieOptions.options, ...defaultSecureCookieConfig, name }
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
        sameSite: "lax",
        domain: undefined,
        expires: new Date(0),
        maxAge: 0,
        secure: true,
        httpOnly: true,
        path: "/",
    })
}

/**
 * Set OAuth-specific cookie options, including a short maxAge of 5 minutes.
 *
 * @param options cookie options obtained from secureCookieOptions
 * @returns formatted cookie options for OAuth cookies
 */
export const oauthCookie = (options: CookieConfigInternal): CookieConfigInternal => {
    return {
        ...options,
        secure: options.secure,
        httpOnly: options.httpOnly,
        maxAge: 5 * 60,
        expires: new Date(Date.now() + 5 * 60 * 1000),
    }
}

const oauthCookieOptions: SerializeOptions = {
    httpOnly: true,
    maxAge: 5 * 60,
    sameSite: "lax",
    expires: new Date(Date.now() + 5 * 60 * 1000),
}

export const defineSecureCookieOptions = (
    useSecure: boolean,
    attributes: SerializeOptions,
    strategy: "host" | "secure" | "standard"
): SerializeOptions => {
    if (!attributes?.httpOnly) {
        console.warn(
            "[WARNING]: Cookie is configured without HttpOnly. This allows JavaScript access via document.cookie and increases XSS risk."
        )
    }
    if ((attributes as StandardCookie["options"])?.domain === "*") {
        console.warn("[WARNING]: Cookie 'Domain' is set to '*', which is insecure. Avoid wildcard domains.")
    }
    if (!useSecure) {
        const options = attributes
        if (options?.secure) {
            console.warn(
                "[WARNING]: The 'Secure' attribute will be disabled for this cookie. Serve over HTTPS to enforce Secure cookies."
            )
        }
        if (options?.sameSite == "none") {
            console.warn("[WARNING]: SameSite=None without a secure connection can be blocked by browsers.")
        }
        if (process.env.NODE_ENV === "production") {
            console.warn("[WARNING]: In production, ensure cookies are served over HTTPS to maintain security.")
        }
        return {
            ...defaultCookieOptions,
            ...attributes,
            sameSite: options?.sameSite === "none" ? "lax" : (options?.sameSite ?? "lax"),
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
 * @experimental
 * @param useSecure
 * @param name
 * @param config
 * @returns
 */
export const createCookieStore = (useSecure: boolean, name?: string, config?: Partial<CookieStoreConfig>): CookieStoreConfig => {
    name ??= COOKIE_NAME
    const securePrefix = useSecure ? "__Secure-" : ""
    const hostPrefix = useSecure ? "__Host-" : ""
    return {
        sessionToken: {
            name: `${securePrefix}${name}.${config?.sessionToken?.name ?? "sessionToken"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...defaultCookieOptions,
                    ...config?.sessionToken?.attributes,
                },
                "standard"
            ),
        },
        state: {
            name: `${securePrefix}${name}.${config?.state?.name ?? "state"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...config?.state?.attributes,
                },
                "standard"
            ),
        },
        csrfToken: {
            name: `${hostPrefix}${name}.${config?.csrfToken?.name ?? "csrfToken"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...config?.csrfToken?.attributes,
                    httpOnly: true,
                    path: "/",
                    domain: undefined,
                },
                "host"
            ),
        },
        redirect_to: {
            name: `${securePrefix}${name}.${config?.redirect_to?.name ?? "redirect_to"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...config?.redirect_to?.attributes,
                },
                "standard"
            ),
        },
        redirect_uri: {
            name: `${securePrefix}${name}.${config?.redirect_uri?.name ?? "redirect_uri"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...config?.redirect_uri?.attributes,
                },
                "standard"
            ),
        },
        code_verifier: {
            name: `${securePrefix}${name}.${config?.code_verifier?.name ?? "code_verifier"}`,
            attributes: defineSecureCookieOptions(
                useSecure,
                {
                    ...oauthCookieOptions,
                    ...config?.code_verifier?.attributes,
                },
                "standard"
            ),
        },
    }
}
