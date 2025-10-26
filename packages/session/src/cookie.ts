import { parse, serialize, SerializeOptions } from "cookie"

export type LiteralUnion<T extends U, U = string> = T | (U & Record<never, never>)

export type CookieName = "sessionToken" | "csrfToken" | "state" | "pkce" | "nonce"

const COOKIE_PREFIX = "aura-stack"

export const defaultCookieOptions: SerializeOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
}

export const expiredCookieOptions: SerializeOptions = {
    ...defaultCookieOptions,
    expires: new Date(0),
}

/**
 * Future: implements __Host- prefix for cookies set on secure connections
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
 * @unstable
 */
export const getCookie = (cookies: string, cookieName: LiteralUnion<CookieName>) => {
    const parsedCookies = parse(cookies)
    return parsedCookies[`${COOKIE_PREFIX}.${cookieName}`]
}
