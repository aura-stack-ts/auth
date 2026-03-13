import { describe, test, expect } from "vitest"
import { createAuth } from "@/createAuth.ts"

describe("createAuth", () => {
    describe("handlers.ALL", () => {
        const auth = createAuth({
            oauth: ["github"],
        })

        test("dispatches GET request to signIn handler", async () => {
            const response = await auth.handlers.ALL(new Request("https://example.com/auth/signIn/github", { method: "GET" }))
            expect(response.status).toBe(302)
        })

        test("dispatches GET requests to the GET handler", async () => {
            const response = await auth.handlers.ALL(new Request("https://example.com/auth/csrfToken", { method: "GET" }))
            expect(response.status).toBe(200)
            expect(await response.json()).toHaveProperty("csrfToken")
        })

        test("dispatches POST requests to the POST handler", async () => {
            const response = await auth.handlers.ALL(
                new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                    method: "POST",
                })
            )

            expect(response.status).toBe(400)
            expect(await response.json()).toEqual({
                type: "AUTH_SECURITY_ERROR",
                code: "SESSION_TOKEN_MISSING",
                message: "The sessionToken is missing.",
            })
        })

        test("returns 405 for unsupported methods", async () => {
            const response = await auth.handlers.ALL(new Request("https://example.com/auth/csrfToken", { method: "PUT" }))
            expect(response.status).toBe(405)
            expect(await response.text()).toBe("Method Not Allowed")
        })
    })

    describe("add custom basePath config", () => {
        const auth = createAuth({
            oauth: ["github"],
            basePath: "/api/v1/auth",
        })

        test("valid custom path for get csrfToken", async () => {
            const response = await auth.handlers.GET(new Request("https://example.com/api/v1/auth/csrfToken"))
            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data).toHaveProperty("csrfToken")
        })

        test("invalid path for get csrfToken", async () => {
            const response = await auth.handlers.GET(new Request("https://example.com/auth/csrfToken"))
            expect(response.status).toBe(404)
        })
    })
})
