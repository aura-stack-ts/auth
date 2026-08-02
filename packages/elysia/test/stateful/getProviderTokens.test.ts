import { describe, test, expect } from "vitest"
import { adapter, app } from "@test/stateful/app"
import { createHash } from "@aura-stack/auth/crypto"

describe("getProviderTokens (Stateful)", () => {
    test("returns 404 when no session cookie is present", async () => {
        const response = await app.handle(new Request("http://localhost:3000/api/auth/providers/github/tokens"))
        expect(response.status).toBe(401)
    })

    test("returns 404 when session cookie is invalid", async () => {
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/tokens", {
                headers: {
                    Cookie: "aura-auth.session_token=invalid-token",
                },
            })
        )
        expect(response.status).toBe(401)
    })

    test("returns empty tokens when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "No Provider User",
            email: "noprovider@example.com",
        })
        const sessionToken = await createHash("session-token-noprovider")
        const tokenHash = await createHash(sessionToken)
        await adapter.createSession({
            id: "session-noprovider",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/tokens", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(400)
        const body = await response.json()
        expect(body).toMatchObject({
            success: false,
            tokens: null,
        })
    })
})
