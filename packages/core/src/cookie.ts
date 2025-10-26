import { parse, serialize, SerializeOptions } from "cookie"
import type { LiteralUnion } from "@/@types/index.js"

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
        throw new Error("No cookies found. There is no session active.")
    }
    const parsedCookies = parse(cookies)
    return parsedCookies[`${COOKIE_PREFIX}.${cookie}`]
}
