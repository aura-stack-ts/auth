import { describe, test, expect } from "vitest"
import type { SerializeOptions } from "cookie"
import { setCookie, createCookieStore, getCookie, getSetCookie, defineSecureCookieOptions } from "@/cookie.js"

const cookieStore = createCookieStore(true)

describe("setCookie", () => {
    test("set state cookie with default options", () => {
        const { expires, ...exclude } = cookieStore.state.attributes
        const cookie = setCookie("state", "xyz123", exclude)
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("state=xyz123; Max-Age=300; Path=/; HttpOnly; Secure; SameSite=Lax")
    })

    test("set csrfToken cookie with disabled httpOnly flag on cookie", () => {
        const { expires, ...exclude } = cookieStore.csrfToken.attributes
        const cookie = setCookie(cookieStore.csrfToken.name, "xyz123", exclude)
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("__Host-aura-auth.csrfToken=xyz123; Max-Age=1296000; Path=/; HttpOnly; Secure; SameSite=Lax")
    })

    test("set pkce cookie with secure flag on cookie", () => {
        const { expires, ...exclude } = cookieStore.code_verifier.attributes
        const cookie = setCookie(cookieStore.code_verifier.name, "xyz123", exclude)
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("__Secure-aura-auth.code_verifier=xyz123; Max-Age=300; Path=/; HttpOnly; Secure; SameSite=Lax")
    })

    test("set custom cookie with default options", () => {
        const cookie = setCookie("customCookie", "customValue")
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("customCookie=customValue")
    })

    test("set session cookie and retrieve it from a client-sent Cookie header", () => {
        const session = setCookie(cookieStore.sessionToken.name, "userId:1", { httpOnly: false })
        const headers = new Headers()
        headers.set("Cookie", session)
        const request = new Request("http://localhost", { headers })
        const cookie = getCookie(request, cookieStore.sessionToken.name)
        expect(cookie).toBeDefined()
        expect(cookie).toBe("userId:1")
    })

    test("retrieve multiple cookies from Cookie header and compare values", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session-1")
        const stateCookie = setCookie(cookieStore.state.name, "state-1")
        const headers = new Headers()
        headers.set("Cookie", `${stateCookie}; ${sessionCookie}`)
        const req = new Request("http://localhost", { headers })
        const session = getCookie(req, cookieStore.sessionToken.name)
        const state = getCookie(req, cookieStore.state.name)
        expect(session).toBe("session-1")
        expect(state).toBe("state-1")
    })

    test("getCookie throws when no Cookie header is present", () => {
        const headers = new Headers()
        const request = new Request("http://localhost", { headers })
        expect(() => getCookie(request, cookieStore.sessionToken.name)).toThrow()
    })
})

describe("getCookie", () => {
    test("retrieve sessionToken from a request without secure", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session", { secure: false })
        const request = new Request("http://localhost", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("retrieve sessionToken from a request with __Secure- prefix", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session", { secure: true })
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("retrieve sessionToken from a request with __Host- prefix", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session")
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("getCookie throws when cookie is not found", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session")
        const request = new Request("http://localhost", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(() => getCookie(request, "nonExistentCookie")).toThrow()
    })

    test("getCookie throws when no Cookie header is present", () => {
        const request = new Request("http://localhost")
        expect(() => getCookie(request, cookieStore.sessionToken.name)).toThrow()
    })

    test("retrieve cookie from Response Set-Cookie header", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "sessionValue")
        const response = new Response(null, {
            headers: {
                "Set-Cookie": sessionCookie,
            },
        })
        expect(getSetCookie(response, cookieStore.sessionToken.name)).toBe("sessionValue")
    })
})

describe("defineSecureCookieOptions", () => {
    const testCases: Array<{
        description: string
        useSecure: boolean
        attributes: SerializeOptions
        strategy: "secure" | "host" | "standard"
        expected: SerializeOptions
    }> = [
        {
            description: "override httpOnly in a secure connection with standard flag",
            useSecure: true,
            attributes: {
                httpOnly: false,
            },
            strategy: "standard",
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "override httpOnly in a secure connection with secure flag",
            useSecure: true,
            attributes: {
                httpOnly: false,
            },
            strategy: "secure",
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "override httpOnly in a secure connection with host flag",
            useSecure: true,
            strategy: "host",
            attributes: {
                httpOnly: false,
            },
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
            },
        },
        {
            description: "disable secure option in a insecure connection with standard flag",
            useSecure: false,
            strategy: "standard",
            attributes: {
                secure: false,
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "disable secure option in a insecure connection with secure flag",
            useSecure: false,
            strategy: "secure",
            attributes: {},
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "disable secure option in a insecure connection with host flag",
            useSecure: false,
            strategy: "host",
            attributes: {},
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "default secure flag in a secure connection",
            useSecure: true,
            strategy: "secure",
            attributes: {},
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "default host flag in a secure connection",
            useSecure: true,
            strategy: "host",
            attributes: {},
            expected: {
                secure: true,

                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
            },
        },
        {
            description: "default secure flag in a insecure connection",
            useSecure: false,
            strategy: "secure",
            attributes: {},
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "default host flag in a insecure connection",
            useSecure: false,
            strategy: "host",
            attributes: {},
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "force to disable secure flag in a secure connection with secure flag",
            useSecure: true,
            strategy: "secure",
            attributes: {
                secure: false,
            },

            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "force to custom domain in a secure connection with host flag",
            useSecure: true,
            strategy: "host",
            attributes: {
                domain: "example.com",
                path: "/dashboard",
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
            },
        },
        {
            description: "force to custom domain in a insecure connection with host flag",
            useSecure: false,
            strategy: "host",
            attributes: {
                domain: "example.com",
                path: "/dashboard",
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/dashboard",
                sameSite: "lax",
                domain: "example.com",
            },
        },
        {
            description: "disable secure and httpOnly attributes in a insecure connection",
            useSecure: false,
            strategy: "standard",
            attributes: {
                secure: false,
                httpOnly: false,
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
            },
        },
        {
            description: "set sameSite to strict with host flag in a secure connection",
            useSecure: true,
            strategy: "host",
            attributes: {
                sameSite: "strict",
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "strict",
            },
        },
    ]

    for (const { description, useSecure, strategy, attributes, expected } of testCases) {
        test(description, () => {
            const config = defineSecureCookieOptions(useSecure, attributes, strategy)
            expect(config).toEqual(expected)
        })
    }
})
