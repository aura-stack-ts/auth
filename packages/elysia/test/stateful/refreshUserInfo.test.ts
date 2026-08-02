import { describe, test, expect } from "vitest"
import { createCSRF, createHash } from "@aura-stack/auth/crypto"
import { adapter, app, auth } from "@test/stateful/app"

describe("refreshUserInfo (Stateful)", () => {
    test("returns 401 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("returns 401 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })

    test("fails when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "Refresh Fail User",
            email: "refreshfail@example.com",
        })
        const sessionToken = "session-token-refresh"
        const tokenHash = await createHash(sessionToken)
        await adapter.createSession({
            id: "session-refresh-fail",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/user/refresh", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            session: null,
        })
    })
})
