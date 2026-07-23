import { getCookie, getSetCookie } from "@/cookie.ts"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/presets.ts"
import { describe, test, expect } from "vitest"

describe("getSession", () => {
    test("getSession with no session token", async () => {
        const session = await api.getSession({ headers: new Headers() })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
    })

    test("getSession with invalid session token", async () => {
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=invalidtoken` },
        })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
    })

    test("getSession with valid session token", async () => {
        const jwt = await jose.encodeJWT({
            sub: "123",
            name: "Alice",
            email: "alice@example.com",
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session.session).toMatchObject({
            user: {
                sub: "123",
                name: "Alice",
                email: "alice@example.com",
            },
            expires: expect.any(String),
        })
    })

    test("getSession with expired session token", async () => {
        const jwt = await jose.encodeJWT({
            sub: "123",
            name: "Alice",
            email: "",
            exp: Math.floor(Date.now() / 1000) - 60,
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
        expect(getSetCookie(session.headers, "aura-auth.session_token")).toBe("")
    })

    test("getSession with session token missing sub claim", async () => {
        const jwt = await jose.encodeJWT({
            name: "Alice",
            email: "alice@example.com",
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
    })

    test("getSession with extra claims in session token", async () => {
        const jwt = await jose.encodeJWT({
            sub: "123",
            name: "Alice",
            email: "alice@example.com",
            role: "admin",
            permissions: ["read", "write"],
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session.session).toMatchObject({
            user: {
                sub: "123",
                name: "Alice",
                email: "alice@example.com",
            },
            expires: expect.any(String),
        })
        expect(session.session?.user).not.toHaveProperty("role")
        expect(session.session?.user).not.toHaveProperty("permissions")
        const decodeSession = await jose.decodeJWT(getCookie(session.headers, "aura-auth.session_token")!)
        expect(decodeSession).toMatchObject({
            sub: "123",
            name: "Alice",
            email: "alice@example.com",
        })
        expect(session.session?.user).not.toHaveProperty("role")
        expect(session.session?.user).not.toHaveProperty("permissions")
    })

    test("getSession refreshes session token if exp is close", async () => {
        const auth = createAuth({ oauth: [], session: { jwt: { expirationStrategy: "rolling" } } })

        const jwt = await auth.jose.encodeJWT({
            sub: "123",
            name: "Alice",
            email: "alice@example.com",
            iat: Math.floor(Date.now() / 1000) - 3600,
            exp: Math.floor(Date.now() / 1000) + 10,
            role: "admin",
            permissions: ["read", "write"],
        })
        const session = await auth.api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session.session).toMatchObject({
            user: {
                sub: "123",
                name: "Alice",
                email: "alice@example.com",
            },
        })
        expect(session.session?.user).not.toHaveProperty("role")
        expect(session.session?.user).not.toHaveProperty("permissions")

        const decodeSession = await jose.decodeJWT(getSetCookie(session.headers, "aura-auth.session_token")!)
        expect(decodeSession).toMatchObject({
            sub: "123",
            name: "Alice",
            email: "alice@example.com",
        })
        expect(session.session?.user).not.toHaveProperty("role")
        expect(session.session?.user).not.toHaveProperty("permissions")
    })
})
