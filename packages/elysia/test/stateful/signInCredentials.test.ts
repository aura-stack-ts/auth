import { describe, test, expect } from "vitest"
import { createCSRF } from "@aura-stack/auth/crypto"
import { adapter, app, auth } from "@test/stateful/app"
import { parseSetCookie } from "@aura-stack/auth/cookies"

describe("signInCredentials (Stateful)", () => {
    test("returns 401 when invalid credentials are provided", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ username: "invalid", password: "invalid" }),
            })
        )
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("returns 200 and a session cookie when valid credentials are provided", async () => {
        const csrfToken = await createCSRF(auth.jose)

        await adapter.createUser({
            id: "credentials:valid",
            name: "John Doe",
            email: "johndoe@example.com",
            image: "https://johndoe.example.com/avatar.png",
        })

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ username: "valid", password: "valid" }),
            })
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        expect(response.headers.get("set-cookie")).toBeDefined()
        const sessionToken = response.headers.getSetCookie()?.find((cookie) => cookie.startsWith("aura-auth.session_token="))
        const parsed = parseSetCookie(sessionToken!).value
        const session = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                headers: { Cookie: `aura-auth.session_token=${parsed}` },
            })
        )
        expect(await session.json()).toEqual({
            success: true,
            session: {
                user: {
                    sub: "credentials:valid",
                    name: "John Doe",
                    email: "johndoe@example.com",
                    image: "https://johndoe.example.com/avatar.png",
                },
                expires: expect.any(String),
            },
        })
    })

    test("sign in credentials fails with CSRF token mismatch", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=different-token`,
                },
                body: JSON.stringify({ username: "valid", password: "valid" }),
            })
        )

        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })
})
