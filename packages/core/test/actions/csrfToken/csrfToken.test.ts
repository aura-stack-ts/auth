import { describe, test, expect } from "vitest"
import { GET } from "@test/presets.js"
import { setCookie } from "@/cookie.js"

describe("csrfTokenAction", () => {
    test("generates a CSRF token and sets it in a cookie", async () => {
        const response = await GET(new Request("https://example.com/auth/csrfToken"))
        const token = await response.json()

        expect(response.status).toBe(200)
        expect(response.headers.get("Set-Cookie")).toMatch(/__Host-aura-auth.csrf_token=/)
        expect(token).toHaveProperty("csrfToken")
    })

    test("returns the same CSRF token if the cookie is valid", async () => {
        const response = await GET(new Request("https://example.com/auth/csrfToken"))
        const token = await response.json()

        const refetch = await GET(
            new Request("https://example.com/auth/csrfToken", {
                method: "GET",
                headers: {
                    Cookie: setCookie("__Host-aura-auth.csrf_token", token.csrfToken),
                },
            })
        )
        expect(refetch.headers.get("Set-Cookie")).toMatch(/__Host-aura-auth.csrf_token=/)
        const refetchToken = await refetch.json()
        expect(refetchToken.csrfToken).toBe(token.csrfToken)
    })

    test("generates a new CSRF token if the cookie is invalid", async () => {
        const invalidCookie = "invalidToken|invalidHash"
        const response = await GET(
            new Request("https://example.com/auth/csrfToken", {
                method: "GET",
                headers: {
                    Cookie: setCookie("__Host-aura-auth.csrf_token", invalidCookie),
                },
            })
        )
        const token = await response.json()
        expect(token).toHaveProperty("csrfToken")
        expect(token.csrfToken).not.toBe(invalidCookie)
        expect(response.headers.get("Set-Cookie")).toMatch(/__Host-aura-auth.csrf_token=/)
    })

    test("generate a CSRF token in a http connection", async () => {
        const response = await GET(new Request("http://example.com/auth/csrfToken"))
        const token = await response.json()

        expect(token).toHaveProperty("csrfToken")
        expect(response.headers.get("Set-Cookie")).toMatch(/aura-auth.csrf_token=/)
    })
})
