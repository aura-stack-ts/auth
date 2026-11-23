import { describe, test, expect } from "vitest"
import { createAuthAPI } from "@/api/index.ts"
import { createContext } from "@/config/context.ts"
import type { LiteralUnion } from "@aura-stack/router"

describe("createAuthAPI", () => {
    describe("uses request-specific cookie settings", () => {
        const ctx = createContext({
            oauth: ["github"],
            trustedProxyHeaders: true,
            trustedOrigins: ["https://app.com", "http://192.1.2.3:4444"],
        })

        const api = createAuthAPI(ctx)

        const trusted = [
            expect.objectContaining({ name: "__Secure-aura-auth.state" }),
            expect.objectContaining({ name: "__Secure-aura-auth.redirect_uri" }),
            expect.objectContaining({ name: "__Secure-aura-auth.redirect_to" }),
            expect.objectContaining({ name: "__Secure-aura-auth.code_verifier" }),
        ]

        const untrusted = [
            expect.objectContaining({ name: "aura-auth.state" }),
            expect.objectContaining({ name: "aura-auth.redirect_uri" }),
            expect.objectContaining({ name: "aura-auth.redirect_to" }),
            expect.objectContaining({ name: "aura-auth.code_verifier" }),
        ]

        const request = (value: LiteralUnion<"http" | "https">) => {
            const forwarded =
                value === "http" ? "host=192.1.2.3:4444; proto=http" : value === "https" ? "host=app.com; proto=https" : value
            return api.signIn("github", {
                headers: {
                    forwarded,
                },
            })
        }

        test("sets secure cookies for a request with a trusted HTTPS origin", async () => {
            const output = await request("https")
            expect(output.headers).toHaveValidSetCookies(trusted)
        })

        test("sets non-secure cookies for a request with a trusted HTTP origin", async () => {
            const output = await request("http")
            expect(output.headers).toHaveValidSetCookies(untrusted)
        })

        test("keeps cookie settings isolated across concurrent HTTPS and HTTP requests", async () => {
            const [secureOutput, insecureOutput] = await Promise.all([request("https"), request("http")])

            expect(secureOutput.headers).toHaveValidSetCookies(trusted)
            expect(insecureOutput.headers).toHaveValidSetCookies(untrusted)
        })

        test("keeps cookie settings isolated across concurrent HTTP and HTTPS requests", async () => {
            const [insecureOutput, secureOutput] = await Promise.all([request("http"), request("https")])

            expect(insecureOutput.headers).toHaveValidSetCookies(untrusted)
            expect(secureOutput.headers).toHaveValidSetCookies(trusted)
        })

        test("isolates cookie settings under high concurrency", async () => {
            const requests = Array.from({ length: 40 }, (_, index) => (index % 2 === 0 ? request("https") : request("http")))
            const outputs = await Promise.all(requests)
            outputs.forEach((output, index) => {
                const expected = index % 2 === 0 ? trusted : untrusted
                expect(output.headers).toHaveValidSetCookies(expected)
            })
        })

        test("does not reuse cookie values across concurrent requests", async () => {
            const outputs = await Promise.all(Array.from({ length: 20 }, () => request("https")))
            outputs.forEach((output) => {
                expect(output.headers).toHaveValidSetCookies(trusted)
            })
        })

        test("does not retain the last concurrent request cookie configuration", async () => {
            await Promise.all([request("https"), request("http"), request("https"), request("http")])

            const [secureOutput, insecureOutput] = await Promise.all([request("https"), request("http")])

            expect(secureOutput.headers).toHaveValidSetCookies(trusted)
            expect(insecureOutput.headers).toHaveValidSetCookies(untrusted)
        })
    })
})
