import { describe, test, expect } from "vitest"
import { createAuth } from "@/index.js"

describe("createAuth", () => {
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
