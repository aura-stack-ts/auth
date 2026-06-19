import { describe, expect, test } from "vitest"
import { jose, PATCH, POST, sessionPayload } from "./presets.ts"
import { createCSRF } from "@/shared/crypto.ts"

describe("Rate Limiter", async () => {
    const csrfToken = await createCSRF(jose)

    const createRequest = async (makeRequest: () => Request, totalRequests: number, allowedLimit: number) => {
        const expectedRejections = totalRequests - allowedLimit
        const requests = Array.from({ length: totalRequests }).map(() => makeRequest())
        const responses = await Promise.all(requests.map((req) => (req.method === "PATCH" ? PATCH(req) : POST(req))))

        const successfulResponses = responses.filter((res) => res.status === 200)
        const rejectedResponses = responses.filter((res) => res.status === 429)

        expect(successfulResponses.length).toBe(allowedLimit)
        expect(rejectedResponses.length).toBe(expectedRejections)

        if (rejectedResponses.length > 0) {
            const targetReject = rejectedResponses[0]
            expect(targetReject.headers.get("Retry-After")).toBeDefined()
        }
    }

    test("signInCredentials", async () => {
        const makeRequest = () =>
            new Request("http://localhost/auth/signIn/credentials", {
                method: "POST",
                body: JSON.stringify({
                    username: "Alice",
                    password: "1234567890",
                }),
                headers: {
                    "x-forwarded-for": "192.168.1.50",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        await createRequest(makeRequest, 10, 8)
    })

    test("signUp", async () => {
        const makeRequest = () =>
            new Request("http://localhost/auth/signUp", {
                method: "POST",
                body: JSON.stringify({
                    name: "Alice",
                    nickname: "Alices_1",
                    password: "1234567890",
                }),
                headers: {
                    "x-forwarded-for": "192.168.1.50",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        await createRequest(makeRequest, 7, 5)
    })

    test("updateSession", async () => {
        const sessionToken = await jose.encodeJWT(sessionPayload)

        const makeRequest = () =>
            new Request("http://localhost/auth/session", {
                method: "PATCH",
                body: JSON.stringify({
                    user: {
                        name: "Alice",
                    },
                }),
                headers: {
                    "x-forwarded-for": "192.168.1.50",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        await createRequest(makeRequest, 12, 10)
    })
})
