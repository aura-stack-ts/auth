import { describe, test, expect, vi, beforeEach, afterEach } from "vitest"
import { createAuth } from "@/createAuth.ts"
import { createSecretValue } from "@/shared/crypto.ts"
import { generateKeyPair } from "@aura-stack/jose/jose"
import type { JWTSigningAlgorithm, SecretKey } from "@/@types/session.ts"

beforeEach(() => {
    /**
     * Skip environment variables because Aura Auth takes them as priority over
     * the options passed to createAuth, and we want to test the options directly
     * without interference from env vars.
     */
    vi.stubEnv("AURA_AUTH_SALT", undefined)
    vi.stubEnv("AURA_AUTH_SECRET", undefined)
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
})

const testJWTAlgorithms = (secret: SecretKey) => {
    describe("JWS algorithms", () => {
        const testCases: JWTSigningAlgorithm[] = [
            "HS256",
            "HS384",
            "HS512",
            "RS256",
            "RS384",
            "RS512",
            "ES256",
            "ES384",
            "ES512",
            "EdDSA",
            "PS256",
        ]
        for (const alg of testCases) {
            test(`algorithm: ${alg}`, async () => {
                vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

                expect(
                    createAuth({
                        oauth: [],
                        secret,
                        session: {
                            jwt: {
                                mode: "signed",
                                signingAlgorithm: alg,
                            },
                        },
                    })
                ).toBeDefined()
            })
        }
    })
}

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

    describe("secret", () => {
        test("invalid secret", () => {
            expect(() => createAuth({ oauth: [] })).toThrow(
                "AURA_AUTH_SECRET environment variable is not set and no secret was provided."
            )
        })

        test("invalid salt", () => {
            const secret = createSecretValue(32)
            expect(() => createAuth({ oauth: [], secret })).toThrow(
                "AURA_AUTH_SALT or AUTH_SALT environment variable is not set. A salt value is required for key derivation."
            )
        })

        describe("crypto.getRandomValues", () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = createSecretValue(32)
            testJWTAlgorithms(secret)
        })

        describe("crypto.generateKey", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = await crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 256,
                },
                true,
                ["encrypt", "decrypt"]
            )
            testJWTAlgorithms(secret)
        })

        describe("crypto.importKey", async () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const rawKey = new Uint8Array(32)
            const secret = await crypto.subtle.importKey(
                "raw",
                rawKey,
                {
                    name: "AES-GCM",
                },
                true,
                ["encrypt", "decrypt"]
            )

            testJWTAlgorithms(secret)
        })

        describe("uint8array secret", () => {
            vi.stubEnv("AURA_AUTH_SALT", createSecretValue(32))

            const secret = new Uint8Array(32)
            testJWTAlgorithms(secret)
        })

        describe("jose.generateKeyPair", async () => {
            const entries = await generateKeyPair("RS256")
            testJWTAlgorithms(entries)
        })
    })
})
