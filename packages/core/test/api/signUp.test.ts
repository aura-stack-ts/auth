import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { getSetCookie } from "@/cookie.ts"
import { api, jose } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

describe("signUp API", () => {
    test("success signUp flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const signUp = await api.signUp({
            payload: {
                name: "johndoe",
                email: "john@example.com",
                image: "https://example.com/image.jpg",
                password: "1234567890",
            },
        })
        expect(signUp).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        const decode = await jose.decodeJWT(getSetCookie(signUp.headers, "aura-auth.session_token")!)
        console.log(decode)
        expect(decode).toMatchObject({
            sub: "1234567890",
            email: "john@example.com",
            name: "johndoe",
            image: "https://example.com/image.jpg",
        })
    })

    test("invalid signUp.onCreateUser return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const { api } = createAuth({
            oauth: [],
            signUp: {
                onCreateUser: () => null,
            },
        })
        const output = await api.signUp({
            payload: {
                name: "johndoe",
                email: "john@example.com",
                image: "https://example.com/image.jpg",
                password: "1234567890",
            },
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "USER_CREATION_FAILED",
                message: "Failed to create user with the provided payload.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
    })
})
