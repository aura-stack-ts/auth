import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { z } from "zod/v4"
import { POST } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

const payload = {
    name: "johndoe",
    email: "john@example.com",
    image: "https://example.com/image.jpg",
    password: "1234567890",
}

describe("signUp API", () => {
    test("success signUp flow", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("invalid signUp.onCreateUser return", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () => null,
            },
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(400)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("invalid signUp.onCreateUser return with custom schema", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string(),
                }),
                onCreateUser: () => null,
            },
        })
        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "ROUTER_ERROR",
            code: "INVALID_REQUEST",
            message: {
                email: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })
    })

    test("valid signUp.onCreateUser return with custom schema", async () => {
        const { handlers } = createAuth({
            oauth: [],
            signUp: {
                schema: z.object({
                    name: z.string(),
                    lastName: z.string(),
                    email: z.string().email(),
                    password: z.string(),
                }),
                onCreateUser: ({ payload }) => ({
                    sub: "1234567890",
                    email: payload.email,
                    name: payload.name,
                    image: "https://example.com/image.jpg",
                }),
            },
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    email: "john@example.com",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("signUp with redirect: true and redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=/dashboard", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })
    })

    test("signUp with redirect: false", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
    })

    test("signUp with redirect: false and redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=/dashboard", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })
    })

    test("signUp with redirect: true and invalid redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=http://malicious.com", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })
    })

    test("signUp with redirect: false and invalid redirectTo", async () => {
        const response = await POST(
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=http://malicious.com", {
                method: "POST",
                body: JSON.stringify(payload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
        })
    })
})
