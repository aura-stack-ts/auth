import { parse, serialize, SerializeOptions } from "cookie"
import type { LiteralUnion } from "@/@types/index.js"
import { AuthError } from "./error.js"
import { encodeJWT, JWTPayload } from "./jose.js"
import { isFalsy } from "./assert.js"

export { parse } from "cookie"

/**
 * Names of cookies used by Aura Auth for session management and OAuth flows
 */
type CookieName = "sessionToken" | "csrfToken" | "state" | "pkce" | "nonce"

/**
 * Prefix for all cookies set by Aura Auth.
 * @todo: allow customization of the prefix
 */
const COOKIE_PREFIX = "aura-stack"

/**
 * Default cookie options for session management.
 */
export const defaultCookieOptions: SerializeOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
}

/**
 * Cookie options for expired cookies.
 */
export const expiredCookieOptions: SerializeOptions = {
    ...defaultCookieOptions,
    expires: new Date(0),
    maxAge: 0,
}

/**
 * Set a cookie with the given name, value, and options.
 *
 * @todo:
 * - implement the __Host- prefix for cookies set on secure connections
 * - implement the __Secure- prefix for cookies set on secure connections
 *
 * Order of attributes:
 * - Expires
 * - Max-Age
 * - Domain
 * - Path
 * - Secure
 * - HttpOnly
 * - SameSite
 * - Partitioned
 * - Priority
 */
export const setCookie = (name: LiteralUnion<CookieName>, value: string, options?: SerializeOptions) => {
    const isSecure = options?.secure
    const securePrefix = isSecure ? "__Secure-" : ""
    const cookieName = `${securePrefix}${COOKIE_PREFIX}.${name}`
    return serialize(cookieName, value, {
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
export const getCookie = (request: Request, cookie: LiteralUnion<CookieName>) => {
    const cookies = request.headers.get("Cookie")
    if (!cookies) {
        throw new AuthError("invalid_request", "No cookies found. There is no active session")
    }
    const parsedCookies = parse(cookies)
    return parsedCookies[`${COOKIE_PREFIX}.${cookie}`]
}

/**
 * Get a set of cookies by their names from a raw cookies string.
 *
 * @param cookies Raw cookies string from the request headers
 * @param cookieNames Array of cookie names to retrieve
 * @returns A record of cookie names and their corresponding values
 */
export const getCookiesByNames = <Keys extends LiteralUnion<CookieName>>(cookies: string, cookieNames: Keys[]) => {
    if (isFalsy(cookies)) {
        throw new AuthError("invalid_request", "No cookies found. There is no active session")
    }
    const parsedCookies = parse(cookies)
    return cookieNames.reduce(
        (previous, cookie) => {
            return { ...previous, [cookie]: parsedCookies[`${COOKIE_PREFIX}.${cookie}`] ?? "" }
        },
        {} as Record<Keys, string>
    )
}

/**
 * Set multiple cookies by their names and values.
 *
 * @param cookies Record of cookie names and their values
 * @param options Cookie serialization options
 * @returns A string representing the set-cookie headers
 */
export const setCookiesByNames = <T extends LiteralUnion<CookieName>>(cookies: Record<T, string>, options?: SerializeOptions) => {
    return Object.keys(cookies).reduce((previous, cookieName) => {
        const cookie = setCookie(cookieName, cookies[cookieName as T], options)
        return previous ? `${previous}; ${cookie}` : cookie
    }, "")
}

/**
 * Create a session cookie containing a signed and encrypted JWT, using the
 * `@aura-stack/jose` package for the encoding.
 *
 * @param session - The JWT payload to be encoded in the session cookie
 * @returns The serialized session cookie string
 */
export const createSessionCookie = async (session: JWTPayload) => {
    try {
        const encoded = await encodeJWT(session)
        return setCookie("sessionToken", encoded)
    } catch {
        throw new AuthError("server_error", "Failed to create session cookie")
    }
}
