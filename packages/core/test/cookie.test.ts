import { describe, test, expect } from "vitest"
import { setCookie, getCookie } from "@/cookie.js"

describe("setCookie", () => {
    test("set state cookie with default options", () => {
        const cookie = setCookie("state", "xyz123")
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.state=xyz123; Path=/; HttpOnly; SameSite=Lax")
    })

    test("set csrfToken cookie with disabled httpOnly flag on cookie", () => {
        const cookie = setCookie("csrfToken", "xyz123", { httpOnly: false })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.csrfToken=xyz123; Path=/; SameSite=Lax")
    })

    test("set pkce cookie with secure flag on cookie", () => {
        const cookie = setCookie("pkce", "xyz123", { secure: true })
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("__Secure-aura-stack.pkce=xyz123; Path=/; HttpOnly; Secure; SameSite=Lax")
    })

    test("set custom cookie with default options", () => {
        const cookie = setCookie("customCookie", "customValue")
        expect(cookie).toBeDefined()
        expect(cookie).toEqual("aura-stack.customCookie=customValue; Path=/; HttpOnly; SameSite=Lax")
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
})
