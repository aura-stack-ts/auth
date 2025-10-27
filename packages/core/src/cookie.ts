import { parse, serialize, SerializeOptions } from "cookie"
import type { LiteralUnion } from "@/@types/index.js"
import { AuraStackError } from "./error.js"

/**
 * Remove it the "@aura-stack/session" package will be stable
 */
export { parse } from "cookie"

type CookieName = "sessionToken" | "csrfToken" | "state" | "pkce" | "nonce"

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

export const getCookie = (request: Request, cookie: LiteralUnion<CookieName>) => {
    const cookies = request.headers.get("Cookie")
    if (!cookies) {
        throw new AuraStackError("No cookies found. There is no session active.")
    }
    const parsedCookies = parse(cookies)
    return parsedCookies[`${COOKIE_PREFIX}.${cookie}`]
}

export const getCookiesByNames = <T extends LiteralUnion<CookieName>>(request: Request, cookieNames: T[]) => {
    const cookies = request.headers.get("Cookie")
    if (!cookies) {
        throw new AuraStackError("No cookies found. There is no session active.")
    }
    const parsedCookies = parse(cookies)
    return cookieNames.reduce(
        (previous, cookie) => {
            return { ...previous, [cookie]: parsedCookies[`${COOKIE_PREFIX}.${cookie}`] }
        },
        {} as Record<T, string | undefined>
    )
}

export const setCookiesByNames = <T extends LiteralUnion<CookieName>>(cookies: Record<T, string>, options?: SerializeOptions) => {
    return Object.keys(cookies).reduce((previous, cookieName) => {
        const cookie = setCookie(cookieName, cookies[cookieName as T], options)
        return previous ? `${previous}; ${cookie}` : cookie
    }, "")
}
