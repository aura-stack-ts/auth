import { describe, test, expect } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/setup/auth.ts"
import { sessionPayload } from "@test/setup/presets.ts"

describe("getSession", () => {
    test("getSession with no session token", async () => {
        const output = await api.getSession({ headers: new Headers() })
        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with invalid session token", async () => {
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=invalidtoken` },
        })
        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with valid session token", async () => {
        const jwt = await jose.encodeJWT(sessionPayload)
        const output = await api.getSession({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${jwt}`,
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
            },
        })
        expect(output).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("getSession with expired session token", async () => {
        const jwt = await jose.encodeJWT({
            ...sessionPayload,
            exp: Math.floor(Date.now() / 1000) - 60,
        })
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=${jwt}` },
        })
        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with session token missing sub claim", async () => {
        const { sub: _, ...spreadSession } = sessionPayload
        const jwt = await jose.encodeJWT(spreadSession)
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=${jwt}` },
        })
        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with extra claims in session token", async () => {
        const jwt = await jose.encodeJWT({
            ...sessionPayload,
            role: "admin",
            permissions: ["read", "write"],
        })
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=${jwt}` },
        })
        expect(output).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.session).not.toContainEqual({
            role: "admin",
            permissions: ["read", "write"],
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([])
    })

    test("getSession refreshes session token if exp is close", async () => {
        const auth = createAuth({ session: { expirationStrategy: "rolling" } })

        const jwt = await auth.jose.encodeJWT({
            ...sessionPayload,
            iat: Math.floor(Date.now() / 1000) - 3600,
            exp: Math.floor(Date.now() / 1000) + 10,
            role: "admin",
            permissions: ["read", "write"],
        })
        const output = await auth.api.getSession({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${jwt}`,
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
            },
        })
        expect(output).toEqual({
            success: true,
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.session).not.toContainEqual({
            role: "admin",
            permissions: ["read", "write"],
        })

        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: expect.any(String),
                path: "/",
                sameSite: "lax",
            }),
        ])
    })
})
