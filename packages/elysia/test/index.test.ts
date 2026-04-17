import { describe, test, expect } from "vitest"
import { app, auth } from "./presets.ts"

describe("GET /api/auth/signIn/github", () => {
    test("redirects to GitHub's OAuth page", async () => {
        const res = await app.handle(new Request("http://localhost/api/auth/signIn/github"))
        expect(res.status).toBe(302)
        expect(res.headers.get("location")).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/)
    })
})

describe("GET /api/auth/session", () => {
    test("returns 401 when no session cookie is present", async () => {
        const res = await app.handle(new Request("http://localhost/api/auth/session"))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body).toMatchObject({
            success: false,
            session: null,
        })
    })

    test("returns session data when a valid session cookie is present", async () => {
        const sessionToken = await auth.jose.encodeJWT({
            sub: "johndoe",
            name: "John Doe",
            email: "johndoe@example.com",
        })
        const res = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toMatchObject({
            session: {
                user: {
                    sub: "johndoe",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
            },
        })
    })
})

describe("GET /api/auth/csrfToken", () => {
    test("returns 200 with a csrfToken in the body", async () => {
        const res = await app.handle(new Request("http://localhost/api/auth/csrfToken"))
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toHaveProperty("csrfToken")
    })
})

describe("GET /api/protected", () => {
    test("returns 401 when no session cookie is present", async () => {
        const res = await app.handle(new Request("http://localhost/api/protected"))
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body).toMatchObject({
            message: "Unauthorized",
        })
    })

    test("returns protected data when a valid session cookie is present", async () => {
        const sessionToken = await auth.jose.encodeJWT({
            sub: "johndoe",
            name: "John Doe",
            email: "johndoe@example.com",
        })
        const res = await app.handle(
            new Request("http://localhost/api/protected", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toMatchObject({
            message: "You have access to this protected resource.",
            session: expect.objectContaining({
                user: {
                    sub: "johndoe",
                    name: "John Doe",
                    email: "johndoe@example.com",
                },
            }),
        })
    })
})

describe("POST /api/auth/signIn/credentials", () => {
    test("returns 401 when invalid credentials are provided", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({ username: "invalid", password: "invalid" }),
            })
        )
        expect(res.status).toBe(401)
        const body = await res.json()
        expect(body).toMatchObject({
            success: false,
            redirectURL: null,
        })
    })

    test("returns 200 and a session cookie when valid credentials are provided", async () => {
        const res = await app.handle(
            new Request("http://localhost/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: "valid", password: "valid" }),
            })
        )
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toMatchObject({
            success: true,
            redirectURL: "/",
        })
        expect(res.headers.get("set-cookie")).toBeDefined()
    })
})
