import { parse, serialize, type SerializeOptions } from "cookie"
import { AuthError } from "./error.js"
import { encodeJWT, type JWTPayload } from "./jose.js"
import { isRequest } from "./assert.js"
import type { CookieName, CookieOptions, CookieOptionsInternal, LiteralUnion, StandardCookie } from "@/@types/index.js"

export { parse } from "cookie"

/**
 * Prefix for all cookies set by Aura Auth.
 */
export const COOKIE_NAME = "aura-stack"

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
export const defaultCookieConfig: CookieOptions = {
    flag: "standard",
    name: COOKIE_NAME,
    options: defaultCookieOptions,
}

export const defaultStandardCookieConfig: CookieOptionsInternal = {
    secure: false,
    httpOnly: true,
    prefix: "",
}

/**
 * Default cookie options for "secure" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__secure-prefix
 */
export const defaultSecureCookieConfig: CookieOptionsInternal = {
    secure: true,
    prefix: "__Secure-",
}

/**
 * Default cookie options for "host" cookies.
 * @see https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#name-the-__host-prefix
 */
export const defaultHostCookieConfig: CookieOptionsInternal = {
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

export const defineDefaultCookieOptions = (options?: CookieOptionsInternal): CookieOptionsInternal => {
    return {
        name: options?.name ?? COOKIE_NAME,
        prefix: options?.secure ? "__Secure-" : (options?.prefix ?? ""),
        ...defaultCookieOptions,
        ...options,
    }
}

/**
 * Set a cookie with the given name, value and `CookieOptionsInternal`; supports secure
 * cookies with the `__Secure-` and `__Host-` prefixes.
 *
 * Cookie attributes are serialized in the following order:
 * Expires, Max-Age, Domain, Path, Secure, HttpOnly, SameSite, Partitioned, Priority.
 */
export const setCookie = (cookieName: LiteralUnion<CookieName>, value: string, options?: CookieOptionsInternal) => {
    const { prefix, name } = defineDefaultCookieOptions(options)
    const cookieNameWithPrefix = `${prefix}${name}.${cookieName}`
    return serialize(cookieNameWithPrefix, value, {
        ...defaultCookieOptions,
        ...options,
    })
}

/**
 * Get a cookie by name from the request.
 *
 * @param request The incoming request object
 * @param cookie Cookie name to retrieve
 * @returns The value of the cookie or undefined if not found
 */
export const getCookie = (petition: Request | Response, cookie: LiteralUnion<CookieName>, options?: CookieOptionsInternal) => {
    const cookies = isRequest(petition) ? petition.headers.get("Cookie") : petition.headers.getSetCookie().join("; ")
    if (!cookies) {
        throw new AuthError("invalid_request", "No cookies found. There is no active session")
    }
    const { name, prefix } = defineDefaultCookieOptions(options)
    const parsedCookies = parse(cookies)
    const value = parsedCookies[`${prefix}${name}.${cookie}`]
    if (value === undefined) {
        throw new AuthError("invalid_request", `Cookie "${cookie}" not found. There is no active session`)
    }
    return value
}

/**
 * Create a session cookie containing a signed and encrypted JWT, using the
 * `@aura-stack/jose` package for the encoding.
 *
 * @param session - The JWT payload to be encoded in the session cookie
 * @returns The serialized session cookie string
 */
export const createSessionCookie = async (session: JWTPayload, cookieOptions: CookieOptionsInternal) => {
    try {
        const encoded = await encodeJWT(session)
        return setCookie("sessionToken", encoded, cookieOptions)
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
export const secureCookieOptions = (request: Request, cookieOptions: CookieOptions): CookieOptionsInternal => {
    const name = cookieOptions.name ?? COOKIE_NAME
    const isSecure =
        request.url.startsWith("https://") ||
        request.headers.get("X-Forwarded-Proto") === "https" ||
        request.headers.get("Forwarded")?.includes("proto=https")
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
                "[WARNING]: TThe 'Secure' attribute will be disabled for this cookie. Serve over HTTPS to enforce Secure cookies."
            )
        }
        if (options?.sameSite == "none") {
            console.warn("[WARNING]: SameSite=None without a secure connection can be blocked by browsers.")
        }
        return {
            ...defaultCookieOptions,
            ...cookieOptions.options,
            sameSite: options?.sameSite === "none" ? "lax" : (options?.sameSite ?? "lax"),
            ...defaultStandardCookieConfig,
            name,
        }
    }
    return cookieOptions.flag === "host"
        ? {
              ...defaultCookieOptions,
              ...cookieOptions.options,
              ...defaultHostCookieConfig,
              name,
          }
        : { ...defaultCookieOptions, ...cookieOptions.options, ...defaultSecureCookieConfig, name }
}
