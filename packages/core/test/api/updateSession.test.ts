import { describe, test, expect } from "vitest"
import { z } from "zod/v4"
import { createAuth } from "@/createAuth.ts"
import { api, jose } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { UserIdentity } from "@/shared/identity.ts"

describe("updateSession API", () => {
    test("invalid session", async () => {
        const updated = await api.updateSession({
            headers: new Headers(),
            session: {},
        })
        expect(updated).toEqual({
            session: null,
            headers: expect.any(Headers),
            success: false,
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with skipCSRFCheck", async () => {
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
            headers: expect.any(Headers),
            success: true,
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with disabled skipCSRFCheck", async () => {
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
            success: true,
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with generic user type", async () => {
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })

    test("updates user session with invalid user data", async () => {
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
            headers: expect.any(Headers),
            success: true,
            toResponse: expect.any(Function),
        })
    })

    test("updates expiry on valid session", async () => {
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
