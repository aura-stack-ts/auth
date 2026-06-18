import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { z } from "zod/v4"
import { createAuth } from "@/createAuth.ts"
import { api, jose, sessionPayload } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { UserIdentity } from "@/shared/identity.ts"
import { getSetCookie } from "@/cookie.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("updateSession API", () => {
    test("invalid session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const updated = await api.updateSession({
            headers: new Headers(),
            session: {},
        })
        expect(updated).toEqual({
            session: null,
            headers: expect.any(Headers),
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "UPDATE_SESSION_INVALID",
                message: "Failed to update session parameters.",
            },
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with skipCSRFCheck", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: newUser,
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with disabled skipCSRFCheck", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            }),
            session: {
                user: newUser,
            },
            skipCSRFCheck: false,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            success: true,
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with generic user type", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const { jose, api } = createAuth({
            oauth: [],
            identity: {
                schema: UserIdentity.extend({
                    role: z.string(),
                    department: z.string(),
                }),
            },
        })

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
            role: "admin",
            department: "Engineering",
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: { role: "superadmin", department: "Executive" },
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    name: "John Doe",
                    email: "johndoe@example.com",
                    image: "https://example.com/johndoe-avatar.jpg",
                    role: "superadmin",
                    department: "Executive",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with invalid user data", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const { jose, api } = createAuth({
            oauth: [],
        })

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: { role: "superadmin", money: "100000" } as any,
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    name: "John Doe",
                    email: "johndoe@example.com",
                    image: "https://example.com/johndoe-avatar.jpg",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates expiry on valid session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
        })
        const csrfToken = await createCSRF(jose)
        const expiresAt = new Date(Date.now() - 100_000).toISOString()
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                expires: expiresAt,
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
                expires: expiresAt,
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updateSession with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: { user: { name: "Alice" } },
            redirectTo: "/dashboard",
            skipCSRFCheck: true,
        })
        expect(updated.headers.get("Location")).toBe("/dashboard")
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    name: "Alice",
                    email: "johndoe@example.com",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updateSession with redirect: false and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: { user: { name: "Alice" } },
            redirect: false,
            redirectTo: "/dashboard",
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    name: "Alice",
                    email: "johndoe@example.com",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("privilege escalation attempt is prevented when updating session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const originalExpiration = new Date(Date.now() + 1000 * 60 * 60).getTime() / 1000
        const sessionToken = await jose.encodeJWT({
            ...sessionPayload,
            exp: originalExpiration,
            admin: false,
        })
        const csrfToken = await createCSRF(jose)

        const attackerExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: {
                    sub: "0987-alter-claims",
                    exp: attackerExpiration,
                    admin: true,
                } as any,
            },
        })

        expect(updated).toEqual({
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        const decoded = await jose.decodeJWT(getSetCookie(updated.headers, "aura-auth.session_token")!)
        expect(decoded.sub).toBe(sessionPayload.sub)
        expect(decoded.sub).not.toBe("0987-alter-claims")
        // It contains the original claims but not the escalated ones
        expect(decoded.exp).not.toEqual(attackerExpiration)
        expect(decoded).not.toHaveProperty("admin")
    })

    test("arbitrary session lifetime extension is prevented when updating session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const originalExpiration = new Date(Date.now() + 1000 * 60 * 60).getTime() / 1000
        const sessionToken = await jose.encodeJWT({
            ...sessionPayload,
            exp: originalExpiration,
        })
        const csrfToken = await createCSRF(jose)

        const attackerExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                expires: new Date(attackerExpiration * 1000).toISOString(),
            },
        })

        expect(updated).toEqual({
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        const sessionExpiration = Math.floor(new Date(updated.session!.expires!).getTime() / 1000)
        const fifteenDaysFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 15

        expect(sessionExpiration).not.toBe(attackerExpiration)
        expect(sessionExpiration).toBeLessThanOrEqual(fifteenDaysFromNow)

        const decoded = await jose.decodeJWT(getSetCookie(updated.headers, "aura-auth.session_token")!)
        expect(decoded.exp).not.toEqual(attackerExpiration)
        expect(decoded.exp).toBeLessThanOrEqual(fifteenDaysFromNow)
    })
})
