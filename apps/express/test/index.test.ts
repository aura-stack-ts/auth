import { describe, test, expect } from "vitest"
import supertest from "supertest"
import { app } from "@/server.js"
import { jose } from "@/auth.js"

describe("GET /api/auth/signIn/github", () => {
    test("redirects to GitHub's OAuth page", async () => {
        const signIn = await supertest(app).get("/api/auth/signIn/github")
        expect(signIn.status).toBe(302)
        expect(signIn.headers).toHaveProperty("location")
        expect(signIn.headers.location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/)
    })
})

describe("GET /api/auth/session", () => {
    test("returns 401 when no session cookie is present", async () => {
        const response = await supertest(app).get("/api/auth/session")
        expect(response.status).toBe(401)
        expect(response.body).toMatchObject({
            authenticated: false,
            message: "Unauthorized",
        })
    })

    test("returns session data when a valid session cookie is present", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "johndoe",
            name: "John Doe",
            email: "johndoe@example.com",
        })
        const request = await supertest(app)
            .get("/api/auth/session")
            .set("Cookie", [`aura-auth.session_token=${sessionToken}`])
        expect(request.status).toBe(200)
        expect(request.body).toMatchObject({
            user: {
                sub: "johndoe",
                name: "John Doe",
                email: "johndoe@example.com",
            },
        })
    })
})

describe("GET /api/auth/csrfToken", () => {
    test("returns 200 with a csrfToken in the body", async () => {
        const response = await supertest(app).get("/api/auth/csrfToken")

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty("csrfToken")
        expect(typeof response.body.csrfToken).toBe("string")
        expect(response.body.csrfToken.length).toBeGreaterThan(0)
    })
})

describe("GET /api/protected", () => {
    test("returns 401 when no session cookie is present", async () => {
        const response = await supertest(app).get("/api/protected")
        expect(response.status).toBe(401)
        expect(response.body).toMatchObject({
            error: "Unauthorized",
        })
    })

    test("returns protected data when a valid session cookie is present", async () => {
        const sessionToken = await jose.encodeJWT({
            sub: "johndoe",
            name: "John Doe",
            email: "johndoe@example.com",
        })
        const response = await supertest(app).get("/api/protected").set("Cookie", `aura-auth.session_token=${sessionToken}`)
        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
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
