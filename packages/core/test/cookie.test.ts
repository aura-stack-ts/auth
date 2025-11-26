import { describe, test, expect } from "vitest"
import { hostCookieOptions } from "./presets.js"
import { setCookie, getCookie, secureCookieOptions, COOKIE_NAME } from "@/cookie.js"
import type { SerializeOptions } from "cookie"
import type { CookieOptions, CookieOptionsInternal } from "@/@types/index.js"

describe("setCookie", () => {
    test("set state cookie with default options", () => {
        const cookie = setCookie("state", "xyz123")
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.state=xyz123; Max-Age=1296000; Path=/; HttpOnly; SameSite=Lax")
    })

    test("set csrfToken cookie with disabled httpOnly flag on cookie", () => {
        const cookie = setCookie("csrfToken", "xyz123", { httpOnly: false })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.csrfToken=xyz123; Max-Age=1296000; Path=/; SameSite=Lax")
    })

    test("set pkce cookie with secure flag on cookie", () => {
        const cookie = setCookie("pkce", "xyz123", { secure: true })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("__Secure-aura-stack.pkce=xyz123; Max-Age=1296000; Path=/; HttpOnly; Secure; SameSite=Lax")
    })

    test("set custom cookie with default options", () => {
        const cookie = setCookie("customCookie", "customValue")
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.customCookie=customValue; Max-Age=1296000; Path=/; HttpOnly; SameSite=Lax")
    })

    test("set session cookie and retrieve it from a client-sent Cookie header", () => {
        const session = setCookie("sessionToken", "userId:1", { httpOnly: false })
        const headers = new Headers()
        headers.set("Cookie", session)
        const request = new Request("http://localhost", { headers })
        const cookie = getCookie(request, "sessionToken")
        expect(cookie).toBeDefined()
        expect(cookie).toBe("userId:1")
    })

    test("retrieve multiple cookies from Cookie header and compare values", () => {
        const sessionCookie = setCookie("sessionToken", "session-1")
        const stateCookie = setCookie("state", "state-1")
        const headers = new Headers()
        headers.set("Cookie", `${stateCookie}; ${sessionCookie}`)
        const req = new Request("http://localhost", { headers })
        const session = getCookie(req, "sessionToken")
        const state = getCookie(req, "state")
        expect(session).toBe("session-1")
        expect(state).toBe("state-1")
    })

    test("getCookie throws when no Cookie header is present", () => {
        const headers = new Headers()
        const req = new Request("http://localhost", { headers })
        expect(() => getCookie(req, "sessionToken")).toThrow()
    })

    test("secure cookie", () => {
        const cookie = setCookie("csrfToken", "secureValue", { secure: true })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual(
            "__Secure-aura-stack.csrfToken=secureValue; Max-Age=1296000; Path=/; HttpOnly; Secure; SameSite=Lax"
        )
    })

    test("host cookie", () => {
        const cookie = setCookie("csrfToken", "hostValue", { prefix: "__Host-", secure: true })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("__Host-aura-stack.csrfToken=hostValue; Max-Age=1296000; Path=/; HttpOnly; Secure; SameSite=Lax")
    })
})

describe("getCookie", () => {
    test("retrieve sessionToken from a request without secure", () => {
        const sessionCookie = setCookie("sessionToken", "session", { secure: false })
        const request = new Request("http://localhost", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, "sessionToken")).toBe("session")
    })

    test("retrieve sessionToken from a request with __Secure- prefix", () => {
        const sessionCookie = setCookie("sessionToken", "session", { secure: true })
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, "sessionToken", { secure: true })).toBe("session")
    })

    test("retrieve sessionToken from a request with __Host- prefix", () => {
        const sessionCookie = setCookie("sessionToken", "session", hostCookieOptions)
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(getCookie(request, "sessionToken", hostCookieOptions)).toBe("session")
    })

    test("getCookie throws when cookie is not found", () => {
        const sessionCookie = setCookie("sessionToken", "session")
        const request = new Request("http://localhost", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(() => getCookie(request, "nonExistentCookie")).toThrow()
    })

    test("getCookie throws when no Cookie header is present", () => {
        const request = new Request("http://localhost")
        expect(() => getCookie(request, "sessionToken")).toThrow()
    })

    test("retrieve cookie from Response Set-Cookie header", () => {
        const sessionCookie = setCookie("sessionToken", "sessionValue")
        const response = new Response(null, {
            headers: {
                "Set-Cookie": sessionCookie,
            },
        })
        expect(getCookie(response, "sessionToken")).toBe("sessionValue")
    })
})

describe("secureCookieOptions", () => {
    const http = new Request("http://localhost:3000")
    const https = new Request("https://www.example.com")

    const testCases: Array<{ description: string; request: Request; options: CookieOptions; expected: CookieOptionsInternal }> = [
        {
            description: "override httpOnly in a secure connection with standard flag",
            request: https,
            options: {
                flag: "standard",
                options: {
                    httpOnly: false,
                },
            },
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "__Secure-",
            },
        },
        {
            description: "override httpOnly in a secure connection with secure flag",
            request: https,
            options: {
                flag: "secure",
                options: {
                    httpOnly: false,
                },
            },
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "__Secure-",
            },
        },
        {
            description: "override httpOnly in a secure connection with host flag",
            request: https,
            options: {
                flag: "host",
                options: {
                    httpOnly: false,
                },
            },
            expected: {
                secure: true,
                httpOnly: false,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
                name: COOKIE_NAME,
                prefix: "__Host-",
            },
        },
        {
            description: "disable secure option in a insecure connection with standard flag",
            request: http,
            options: {
                flag: "standard",
                options: {
                    secure: false,
                },
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "disable secure option in a insecure connection with secure flag",
            request: http,
            options: {
                flag: "secure",
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "disable secure option in a insecure connection with host flag",
            request: http,
            options: {
                flag: "host",
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "default secure flag in a secure connection",
            request: https,
            options: {
                flag: "secure",
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "__Secure-",
            },
        },
        {
            description: "default host flag in a secure connection",
            request: https,
            options: {
                flag: "host",
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
                name: COOKIE_NAME,
                prefix: "__Host-",
            },
        },
        {
            description: "default secure flag in a insecure connection",
            request: http,
            options: {
                flag: "secure",
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "default host flag in a insecure connection",
            request: http,
            options: {
                flag: "host",
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "force to disable secure flag in a secure connection with secure flag",
            request: https,
            options: {
                flag: "secure",
                options: {
                    secure: false,
                } as SerializeOptions,
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "__Secure-",
            },
        },
        {
            description: "force to custom domain in a secure connection with host flag",
            request: https,
            options: {
                flag: "host",
                options: {
                    domain: "example.com",
                    path: "/dashboard",
                } as SerializeOptions,
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                domain: undefined,
                name: COOKIE_NAME,
                prefix: "__Host-",
            },
        },
        {
            description: "force to custom domain in a insecure connection with host flag",
            request: http,
            options: {
                flag: "host",
                options: {
                    domain: "example.com",
                    path: "/dashboard",
                } as SerializeOptions,
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/dashboard",
                sameSite: "lax",
                domain: "example.com",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
        {
            description: "disable secure and httpOnly attributes in a insecure connection",
            request: http,
            options: {
                flag: "standard",
                options: {
                    secure: false,
                    httpOnly: false,
                },
            },
            expected: {
                secure: false,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: COOKIE_NAME,
                prefix: "",
            },
        },
    ]

    for (const { description, request, options, expected } of testCases) {
        test(description, () => {
            const config = secureCookieOptions(request, options)
            expect(config).toEqual<SerializeOptions>(expected)
        })
    }
})
