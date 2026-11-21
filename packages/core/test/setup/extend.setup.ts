import { expect, type MatcherState } from "vitest"
import { parseSetCookie, type SetCookie } from "@aura-stack/router/cookie"
import { secureApiHeaders, toUnionHeaders } from "@/shared/http/headers.ts"

const getSetCookies = (source: Headers | Response) => {
    const headers = source instanceof Response ? source.headers : source
    const rawCookies = headers.getSetCookie()
    return rawCookies.map((raw) => parseSetCookie(raw))
}

/**
 * Extends Vitest utilities to validate outgoing response headers and verify
 * that response headers do not reflect incoming request headers.
 * @see https://github.com/aura-stack-ts/auth/pull/333
 */
export function toHaveValidSecurityHeaders(this: MatcherState, headers: Headers, extra?: Record<string, string>) {
    const union = toUnionHeaders(new Headers(secureApiHeaders), new Headers(extra))
    // Ignores "Set-Cookie" headers. Please use `toHaveValidSetCookies`
    const setCookie = headers.getSetCookie()
    headers.delete("set-cookie")
    expect(Object.fromEntries(headers)).toEqual(Object.fromEntries(union))
    if (setCookie) {
        setCookie.forEach((cookie) => headers.append("set-cookie", cookie))
    }

    return {
        pass: true,
        message: () => "Expected response headers not to satisfy security header checks, but all passed",
    }
}

export function toHaveValidSetCookies(this: MatcherState, headers: Headers, values: SetCookie[]) {
    expect(getSetCookies(headers)).toStrictEqual(values)

    return {
        pass: true,
        message: () => "Expected response headers not to satisfy security header checks, but all passed",
    }
}

expect.extend({
    toHaveValidSecurityHeaders,
    toHaveValidSetCookies,
})

declare module "vitest" {
    interface Matchers<R, T> {
        toHaveValidSecurityHeaders: (extra?: Record<string, string>) => R
        toHaveValidSetCookies: (values: SetCookie[]) => R
    }
}
