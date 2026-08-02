import { describe, test, expect } from "vitest"
import { getSessionToken } from "@test/utils"
import { adapter, app, auth } from "@test/stateful/app"
import { createCSRF, createHash } from "@aura-stack/auth/crypto"

describe("signOut (Stateful)", () => {
    test("returns 403 or clears session when no active session cookie is present", async () => {
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
            })
        )
        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("successfully revokes session and clears cookie when a valid session is present", async () => {
        const user = await adapter.createUser({
            name: "SignOut User",
            email: "signout@example.com",
            status: "active",
        })
        const sessionToken = "token-hash-to-revoke"
        const tokenHash = await createHash(sessionToken)
        const session = await adapter.createSession({
            id: "session-signout-123",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(202)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        const revokedSession = await adapter.getSessionById(session.id)
        expect(revokedSession).toBeNull()
        const { cookie, tokenValue } = getSessionToken(response)
        expect(cookie).toBeDefined()
        expect(tokenValue).toBe("")
    })

    test("sign out fails with CSRF token mismatch", async () => {
        const user = await adapter.createUser({
            name: "CSRF Mismatch User",
            email: "csrfmismatch@example.com",
        })
        const sessionToken = "token-hash-csrf-mismatch"
        const tokenHash = await createHash(sessionToken)
        await adapter.createSession({
            id: "session-csrf-mismatch",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash,
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=different-token`,
                },
            })
        )

        expect(response.status).toBe(403)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })
})
