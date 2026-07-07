import { getSetCookie } from "@/cookie.ts"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { identitySchema as UserIdentityArkType } from "@/identity/arktype.ts"
import { identitySchema as UserIdentityValibot } from "@/identity/valibot.ts"
import { jose, PATCH, sessionPayload } from "@test/presets.ts"
import { describe, test, expect, vi } from "vitest"

vi.mock("@aura-stack/rate-limiter", async () => {
    const actual = await vi.importActual<typeof import("@aura-stack/rate-limiter")>("@aura-stack/rate-limiter")
    return {
        ...actual,
        createRateLimiter: (...args: Parameters<typeof actual.createRateLimiter>) => {
            const limiters = actual.createRateLimiter(...args)

            for (const limiter of Object.values(limiters)) {
                limiter.check = vi.fn().mockResolvedValue({
                    ok: true,
                    limit: Number.MAX_SAFE_INTEGER,
                    remaining: Number.MAX_SAFE_INTEGER,
                    resetAt: Date.now() + 60000,
                    retryAfter: 0,
                    toResponse: () => new Response(),
                })
            }

            return limiters
        },
    }
})

describe("updateSession action", () => {
    test("invalid session", async () => {
        const response = await PATCH(
            new Request("http://localhost:3000/auth/session", {
                method: "PATCH",
                body: JSON.stringify({}),
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toMatchObject({
            session: null,
            success: false,
        })
    })

    test("updates user session with redirect: true (by default)", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
            // Doesn't redirect because redirectTo is not set
            redirect: false,
            redirectURL: null,
        })
    })

    test("updates user session with redirect: false", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
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
        })
    })

    test("updates user session with redirect: true and redirectTo: string", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirectTo=/dashboard", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: true,
            redirectURL: null,
        })
    })

    test("updates user session with redirect: false and redirectTo: string", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false&redirectTo=/dashboard", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })
    })

    test("updates user session with valibot schema", async () => {
        const { handlers, jose } = createAuth({
            oauth: [],
            identity: {
                schema: UserIdentityValibot,
            },
        })

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await handlers.PATCH(
            new Request("http://localhost:3000/auth/session", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toMatchObject({
            session: {
                user: {
                    sub: "1234567890",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
        })
    })

    test("updates user session with arktype schema", async () => {
        const { handlers, jose } = createAuth({
            oauth: [],
            identity: {
                schema: UserIdentityArkType,
            },
        })

        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await handlers.PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
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
        })
    })

    test("rejects session update when X-CSRF-Token header is missing", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session", {
                method: "PATCH",
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("updates user session with stripped fields", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "1234567890",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://example.com/johndoe-avatar.jpg",
        })
        const csrfToken = await createCSRF(jose)

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
            role: "admin",
            permissions: ["read", "write", "delete"],
        }

        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ user: newUser }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: expect.objectContaining({
                user: {
                    sub: "1234567890",
                    name: "Alice Smith",
                    email: "alicesmith@example.com",
                    image: "https://example.com/alicesmith-avatar.jpg",
                },
            }),
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("privilege escalation attempt is prevented when updating session", async () => {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60).getTime() / 1000
        const sessionToken = await jose.encodeJWT({
            ...sessionPayload,
            exp: expiresAt,
            admin: false,
        })
        const csrfToken = await createCSRF(jose)

        const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    user: {
                        /**
                         * Sub can't be overwritten (its the unique identifier that can't be changed)
                         */
                        sub: "0987-alter-claims",
                        /** Expiration override must be made from the body.expires */
                        exp: expiration,
                        admin: true,
                    },
                }),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
        })

        const decoded = await jose.decodeJWT(getSetCookie(response, "aura-auth.session_token")!)
        expect(decoded.sub).toBe(sessionPayload.sub)
        expect(decoded.sub).not.toBe("0987-alter-claims")
        // It contains the original claims but not the escalated ones
        expect(decoded.exp).not.toEqual(expiration)
        expect(decoded).not.toHaveProperty("admin")
    })

    test("arbitrary session lifetime extension is prevented when updating session", async () => {
        const originalExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 5

        const sessionToken = await jose.encodeJWT({
            ...sessionPayload,
            exp: originalExpiration, // 5 hour from now
        })
        const csrfToken = await createCSRF(jose)

        const attackerExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const response = await PATCH(
            new Request("http://localhost:3000/auth/session?redirect=false", {
                method: "PATCH",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    expires: new Date(attackerExpiration * 1000).toISOString(),
                }),
            })
        )

        expect(response.status).toBe(200)
        const session = await response.json()
        expect(session).toEqual({
            session: {
                user: sessionPayload,
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
        })
        const sessionExpiration = Math.floor(new Date(session.session.expires).getTime() / 1000)
        const fifteenDaysFromNow = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 15

        expect(sessionExpiration).not.toBe(attackerExpiration)
        expect(sessionExpiration).toBeLessThanOrEqual(fifteenDaysFromNow)

        const decoded = await jose.decodeJWT(getSetCookie(response, "aura-auth.session_token")!)
        expect(decoded.exp).not.toEqual(attackerExpiration)
        expect(decoded.exp).toBeLessThanOrEqual(fifteenDaysFromNow)
    })
})
