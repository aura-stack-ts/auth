import { createCSRF } from "@/shared/crypto.ts"
import { jose, PATCH } from "@test/presets.ts"
import { describe, test, expect } from "vitest"

describe("updateSession action", () => {
    test("invalid session", async () => {
        const response = await PATCH(
            new Request("http://localhost:3000/auth/session", {
                method: "PATCH",
                body: JSON.stringify({}),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toMatchObject({
            session: null,
            success: false,
        })
    })

    test("updates user session", async () => {
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
        expect(response.status).toBe(401)
        expect(await response.json()).toMatchObject({
            session: null,
            success: false,
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
            session: expect.objectContaining({
                user: {
                    sub: "1234567890",
                    name: "Alice Smith",
                    email: "alicesmith@example.com",
                    image: "https://example.com/alicesmith-avatar.jpg",
                },
            }),
            success: true,
        })
    })
})
