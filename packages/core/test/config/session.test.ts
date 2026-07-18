import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { sessionPayload } from "@test/presets.ts"
import { getSetCookie } from "@/cookie.ts"

describe("session: stateless strategy", () => {
    beforeEach(() => {
        vi.unstubAllEnvs()
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-03-24T00:00:00Z"))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    const makeCookieHeader = (token: string) => ({
        Cookie: `__Secure-aura-auth.session_token=${token}`,
    })

    describe("Initialization & Defaults", () => {
        test("defaults to maxAge 15 days and absolute strategy", async () => {
            const { handlers, jose } = createAuth({ oauth: [], logger: false })
            const { GET } = handlers

            const token = await jose.encodeJWT(sessionPayload)

            vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000)

            const req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(token),
            })
            const res = await GET(req)
            const body = await res.json()

            expect(res.status).toBe(200)
            expect(body.success).toBe(true)

            const expectedExp = new Date(new Date("2026-03-24T00:00:00Z").getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
            expect(body.session.expires).toBe(expectedExp)

            expect(res.headers.get("Set-Cookie")).toBeNull()
        })
    })

    describe("Expiration Models (Rolling)", () => {
        test("always updates expiration upon access", async () => {
            const { handlers, jose } = createAuth({
                oauth: [],
                session: { jwt: { expirationStrategy: "rolling", maxAge: 3600 } },
                logger: false,
            })
            const { GET } = handlers

            let currentToken = await jose.encodeJWT(sessionPayload)

            vi.advanceTimersByTime(15 * 60 * 1000)

            let req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            let res = await GET(req)
            let body = await res.json()

            let expectedExp = new Date(Date.now() + 3600 * 1000).toISOString()
            expect(body.session.expires).toBe(expectedExp)

            let newCookieStr = getSetCookie(res, "__Secure-aura-auth.session_token")
            expect(newCookieStr).toBeDefined()
            currentToken = newCookieStr!

            vi.advanceTimersByTime(30 * 60 * 1000)

            req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            res = await GET(req)
            body = await res.json()

            expectedExp = new Date(Date.now() + 3600 * 1000).toISOString()
            expect(body.session.expires).toBe(expectedExp)
            expect(getSetCookie(res, "__Secure-aura-auth.session_token")).toBeDefined()
        })
    })

    describe("Expiration Models (Sliding)", () => {
        test("updates only when within 25% threshold", async () => {
            const { handlers, jose } = createAuth({
                oauth: [],
                session: { jwt: { expirationStrategy: "sliding", maxAge: 3600 } }, // threshold is 900 seconds
                logger: false,
            })
            const { GET } = handlers

            let currentToken = await jose.encodeJWT(sessionPayload)

            vi.advanceTimersByTime(15 * 60 * 1000)

            let req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            let res = await GET(req)
            let body = await res.json()

            expect(res.headers.get("Set-Cookie")).toBeNull()

            vi.advanceTimersByTime(35 * 60 * 1000)

            req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            res = await GET(req)
            body = await res.json()

            const newCookieStr = getSetCookie(res, "__Secure-aura-auth.session_token")
            expect(newCookieStr).toBeDefined()

            const expectedExp = new Date(Date.now() + 3600 * 1000).toISOString()
            expect(body.session.expires).toBe(expectedExp)
        })
    })

    describe("JWT Max Expiration (mexp)", () => {
        test("enforces strict cut-off even if rolling strategy extends standard exp", async () => {
            const { handlers, jose } = createAuth({
                oauth: [],
                session: { jwt: { expirationStrategy: "rolling", maxAge: 3600 } },
                logger: false,
            })
            const { GET } = handlers

            const maxExpiration = Math.floor(Date.now() / 1000) + 7200

            let currentToken = await jose.encodeJWT({ ...sessionPayload, mexp: maxExpiration })

            vi.advanceTimersByTime(0.75 * 3600 * 1000)

            let req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            let res = await GET(req)
            expect(res.status).toBe(200)

            let newCookieStr = getSetCookie(res, "__Secure-aura-auth.session_token")
            expect(newCookieStr).toBeDefined()
            currentToken = newCookieStr!

            vi.advanceTimersByTime(1.5 * 3600 * 1000)

            req = new Request("https://example.com/auth/session", {
                headers: makeCookieHeader(currentToken),
            })
            res = await GET(req)
            let body = await res.json()

            expect(res.status).toBe(401)
            expect(body.success).toBe(false)
            expect(body.session).toBeNull()
        })
    })
})
