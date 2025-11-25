import { describe, test, expect } from "vitest"
import { csrfTokenAction } from "@/actions/index.js"
import { createRouter } from "@aura-stack/router"
import { createOAuthIntegrations } from "@/oauth/index.js"
import { defaultCookieConfig, defaultHostCookieConfig, setCookie } from "@/cookie.js"

const oauth = createOAuthIntegrations([])

const { GET } = createRouter([csrfTokenAction({ oauth, cookies: defaultCookieConfig })])

describe("csrfTokenAction", () => {
    test("generates a CSRF token and sets it in a cookie", async () => {
        const response = await GET(new Request("https://example.com/csrfToken"))
        const token = await response.json()
        expect(response.status).toBe(200)
        expect(token).toHaveProperty("csrfToken")
        expect(response.headers.get("Set-Cookie")).toMatch(/__Host-aura-stack.csrfToken=/)
    })

    test("returns the same CSRF token if the cookie is valid", async () => {
        const response = await GET(new Request("https://example.com/csrfToken"))
        const token = await response.json()

        const refetch = await GET(
            new Request("https://example.com/csrfToken", {
                method: "GET",
                headers: {
                    Cookie: setCookie("csrfToken", token.csrfToken, { ...defaultHostCookieConfig }),
                },
            })
        )
        const refetchToken = await refetch.json()
        expect(refetchToken.csrfToken).toBe(token.csrfToken)
    })

    test("generates a new CSRF token if the cookie is invalid", async () => {
        const invalidCookie = "invalidToken|invalidHash"
        const response = await GET(
            new Request("https://example.com/csrfToken", {
                method: "GET",
                headers: {
                    Cookie: setCookie("csrfToken", invalidCookie, { ...defaultHostCookieConfig }),
                },
            })
        )
        const token = await response.json()
        expect(token).toHaveProperty("csrfToken")
        expect(token.csrfToken).not.toBe(invalidCookie)
    })

    test("generate a CSRF token in a http connection", async () => {
        const response = await GET(new Request("http://example.com/csrfToken"))
        const token = await response.json()
    })
})
