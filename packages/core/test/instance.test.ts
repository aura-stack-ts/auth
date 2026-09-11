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

            expect(response.status).toBe(403)
        })

        test("returns 404 for unsupported methods", async () => {
            const response = await auth.handlers.ALL(new Request("https://example.com/auth/csrfToken", { method: "PUT" }))
            expect(response.status).toBe(404)
            expect(await response.json()).toEqual({
                type: "ROUTER_FLOW",
                code: "NOT_FOUND",
                message:
                    "The requested route address cannot be found or is unavailable on this application endpoint server context.",
            })
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

    describe("trustedProxyHeader", () => {
        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is not set", () => {
            expect(() =>
                createAuth({
                    oauth: [],
                    trustedProxyHeaders: true,
                    trustedOrigins: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("does not throw error if trustedProxyHeaders is enabled and trustedOrigins is set", () => {
            expect(() =>
                createAuth({
                    oauth: [],
                    trustedProxyHeaders: true,
                    trustedOrigins: ["https://example.com"],
                })
            ).not.toThrow()
        })

        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is not set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("throws error if trustedProxyHeaders is enabled but trustedOrigins is empty set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")
            vi.stubEnv("TRUSTED_ORIGINS", "")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).toThrow(
                "Security assertion failed during instantiation: 'trustedProxyHeaders' was enabled, but 'trustedOrigins' is completely empty or undefined. Real proxy networks require explicit origin mapping rules to mitigate host-header hijacking and cache-poisoning vectors."
            )
        })

        test("does not throw error if trustedProxyHeaders is enabled and trustedOrigins is set via env", () => {
            vi.stubEnv("TRUSTED_PROXY_HEADERS", "true")
            vi.stubEnv("TRUSTED_ORIGINS", "https://example.com")

            expect(() =>
                createAuth({
                    oauth: [],
                })
            ).not.toThrow()
        })
    })
})
