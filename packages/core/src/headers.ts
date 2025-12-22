import { serialize, parse, Cookies, parseSetCookie } from "@aura-stack/router/cookie"
import { AuthError } from "@/errors.js"
import { defineDefaultCookieOptions } from "@/cookie.js"
import { CookieConfigInternal, CookieName } from "@/@types/index.js"

/**
 * Headers to prevent caching of responses. It includes Pragma header for HTTP/1.0 compatibility.
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Pragma
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Vary
 */
export const cacheControl: HeadersInit = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Cookie",
}

/**
 * @experimental
 */
export class HeadersBuilder {
    private headers: Headers
    private cookieOptions: CookieConfigInternal | undefined

    constructor(initialHeaders?: HeadersInit, cookieOptions?: CookieConfigInternal) {
        this.cookieOptions = cookieOptions
        this.headers = new Headers(initialHeaders)
    }

    setHeader(name: string, value: string): HeadersBuilder {
        this.headers.set(name, value)
        return this
    }

    setCookie(cookieName: CookieName, value: string): HeadersBuilder {
        if (!this.cookieOptions) {
            throw new AuthError("server_error", "Cookie options must be defined to set cookies.")
        }
        const { prefix, name, ...cookieOptions } = defineDefaultCookieOptions(this.cookieOptions)
        const cookieNameWithPrefix = `${prefix}${name}.${cookieName}`
        this.headers.append("Set-Cookie", serialize(cookieNameWithPrefix, value, cookieOptions))
        return this
    }

    getHeader(name: string): string | null {
        return this.headers.get(name)
    }

    getCookie(name: string): string | undefined {
        const cookies = parse(this.headers.get("cookie") ?? "")
        return cookies[name]
    }

    getSetCookie(name: string): string | undefined {
        const cookies = this.headers.getSetCookie()
        const cookie = cookies.find((cookie) => cookie.startsWith(name + "="))
        return cookie ? parseSetCookie(cookie).value : undefined
    }

    setCookieOptions(options: CookieConfigInternal): HeadersBuilder {
        this.cookieOptions = options
        return this
    }

    toHeaders(): Headers {
        return new Headers(this.headers)
    }

    toCookies(): Cookies {
        return parse(this.headers.get("cookie") ?? "")
    }
}
