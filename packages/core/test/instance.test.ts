import { describe, test, expect, vi, beforeEach } from "vitest"
import { createAuth } from "@/createAuth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

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

            expect(response.status).toBe(401)
        })

        test("returns 405 for unsupported methods", async () => {
            const response = await auth.handlers.ALL(new Request("https://example.com/auth/csrfToken", { method: "PUT" }))
            expect(response.status).toBe(405)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "METHOD_NOT_ALLOWED",
                message: "The requested resource does not support the submitted HTTP execution method request verb.",
            })
        })
    })
})
