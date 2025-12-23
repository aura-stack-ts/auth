import { describe, test, expect } from "vitest"
import type { SerializeOptions } from "cookie"
import {
    setCookie,
    secureCookieOptions,
    COOKIE_NAME,
    createCookieStore,
    unstable__get_cookie,
    unstable__get_set_cookie,
} from "@/cookie.js"
import type { CookieConfig, CookieConfigInternal } from "@/@types/index.js"

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
        const cookie = unstable__get_cookie(request, cookieStore.sessionToken.name)
        expect(cookie).toBeDefined()
        expect(cookie).toBe("userId:1")
    })

    test("retrieve multiple cookies from Cookie header and compare values", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session-1")
        const stateCookie = setCookie(cookieStore.state.name, "state-1")
        const headers = new Headers()
        headers.set("Cookie", `${stateCookie}; ${sessionCookie}`)
        const req = new Request("http://localhost", { headers })
        const session = unstable__get_cookie(req, cookieStore.sessionToken.name)
        const state = unstable__get_cookie(req, cookieStore.state.name)
        expect(session).toBe("session-1")
        expect(state).toBe("state-1")
    })

    test("getCookie throws when no Cookie header is present", () => {
        const headers = new Headers()
        const request = new Request("http://localhost", { headers })
        expect(() => unstable__get_cookie(request, cookieStore.sessionToken.name)).toThrow()
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
        expect(unstable__get_cookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("retrieve sessionToken from a request with __Secure- prefix", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session", { secure: true })
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(unstable__get_cookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("retrieve sessionToken from a request with __Host- prefix", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session")
        const request = new Request("https://www.example.com", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(unstable__get_cookie(request, cookieStore.sessionToken.name)).toBe("session")
    })

    test("getCookie throws when cookie is not found", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "session")
        const request = new Request("http://localhost", {
            headers: {
                Cookie: sessionCookie,
            },
        })
        expect(() => unstable__get_cookie(request, "nonExistentCookie")).toThrow()
    })

    test("getCookie throws when no Cookie header is present", () => {
        const request = new Request("http://localhost")
        expect(() => unstable__get_cookie(request, cookieStore.sessionToken.name)).toThrow()
    })

    test("retrieve cookie from Response Set-Cookie header", () => {
        const sessionCookie = setCookie(cookieStore.sessionToken.name, "sessionValue")
        const response = new Response(null, {
            headers: {
                "Set-Cookie": sessionCookie,
            },
        })
        expect(unstable__get_set_cookie(response, cookieStore.sessionToken.name)).toBe("sessionValue")
    })
})

describe("secureCookieOptions", () => {
    const http = new Request("http://localhost:3000")
    const https = new Request("https://www.example.com")

    const testCases: Array<{ description: string; request: Request; options: CookieConfig; expected: CookieConfigInternal }> = [
        {
            description: "override httpOnly in a secure connection with standard flag",
            request: https,
            options: {
                strategy: "standard",
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
                strategy: "secure",
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
                strategy: "host",
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
                strategy: "standard",
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
                strategy: "secure",
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
                strategy: "host",
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
                strategy: "secure",
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
                strategy: "host",
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
                strategy: "secure",
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
                strategy: "host",
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
                strategy: "secure",
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
                strategy: "host",
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
                strategy: "host",
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
                strategy: "standard",
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
        {
            description: "custom cookie name with secure flag in a secure connection",
            request: https,
            options: {
                strategy: "secure",
                name: "aura-stack-auth-cookie",
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "lax",
                name: "aura-stack-auth-cookie",
                prefix: "__Secure-",
            },
        },
        {
            description: "set sameSite to strict with host flag in a secure connection",
            request: https,
            options: {
                strategy: "host",
                options: {
                    sameSite: "strict",
                },
            },
            expected: {
                secure: true,
                httpOnly: true,
                maxAge: 1296000,
                path: "/",
                sameSite: "strict",
                name: COOKIE_NAME,
                prefix: "__Host-",
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
