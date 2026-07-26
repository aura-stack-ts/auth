import { describe, test, expect } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { getCookie, getSetCookie } from "@/cookie.ts"
import { api, jose, sessionPayload } from "@test/presets.ts"

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
        const jwt = await jose.encodeJWT(sessionPayload)
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("getSession with expired session token", async () => {
        const jwt = await jose.encodeJWT({
            ...sessionPayload,
            exp: Math.floor(Date.now() / 1000) - 60,
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSetCookie(session.headers, "aura-auth.session_token")).toBe("")
    })

    test("getSession with session token missing sub claim", async () => {
        const { sub: _, ...spreadSession } = sessionPayload
        const jwt = await jose.encodeJWT(spreadSession)
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("getSession with extra claims in session token", async () => {
        const jwt = await jose.encodeJWT({
            ...sessionPayload,
            role: "admin",
            permissions: ["read", "write"],
        })
        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(session.session).not.toContainEqual({
            role: "admin",
            permissions: ["read", "write"],
        })
        const decodeSession = await jose.decodeJWT(getCookie(session.headers, "aura-auth.session_token")!)
        expect(decodeSession).toMatchObject(sessionPayload)
    })

    test("getSession refreshes session token if exp is close", async () => {
        const auth = createAuth({ oauth: [], session: { jwt: { expirationStrategy: "rolling" } } })

        const jwt = await auth.jose.encodeJWT({
            ...sessionPayload,
            iat: Math.floor(Date.now() / 1000) - 3600,
            exp: Math.floor(Date.now() / 1000) + 10,
            role: "admin",
            permissions: ["read", "write"],
        })
        const session = await auth.api.getSession({
            headers: { Cookie: `aura-auth.session_token=${jwt}` },
        })
        expect(session).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(session.session).not.toContainEqual({
            role: "admin",
            permissions: ["read", "write"],
        })

        const decodeSession = await jose.decodeJWT(getSetCookie(session.headers, "aura-auth.session_token")!)
        expect(decodeSession).toMatchObject(sessionPayload)
    })
})
