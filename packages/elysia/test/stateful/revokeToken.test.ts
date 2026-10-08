import { describe, test, expect, vi } from "vitest"
import { adapter, app, auth } from "@test/stateful/app"
import { createCSRF, createHash } from "@aura-stack/auth/crypto"

describe("POST /api/auth/revokeToken", () => {
    test("returns 401 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
    })

    test("returns 401 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({ success: false })
    })

    test("returns 200 when the token is successfully revoked", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const mockFetch = vi.fn()
        mockFetch.mockResolvedValueOnce({ ok: true, status: 200 })

        vi.stubGlobal("fetch", mockFetch)

        const user = await adapter.createUser({
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const sessionToken = "session-token"
        const tokenHash = await createHash(sessionToken)
        await adapter.createSession({
            id: "session-connected",
            userId: user.id,
            tokenHash,
            authenticatedWith: "oauth",
            expiresAt: new Date(Date.now() + 3600000),
            mfaState: "none",
            status: "active",
            deviceId: null,
            metadata: null,
        })

        const account = await adapter.createAccount({
            id: "account-1",
            userId: user.id,
            type: "oauth",
            provider: "github-with-revoke",
            providerUserId: "github-user-1",
            status: "active",
        })

        await adapter.createOAuthAccount({
            accountId: account.id,
            accessToken: "access-token-1",
            accessTokenExpiresAt: new Date(Date.now() + 3600000),
            refreshToken: "refresh-token-1",
            scopes: "read:user",
            tokenType: "Bearer",
        })
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github-with-revoke/tokens/revoke", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=${sessionToken}; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(mockFetch).toHaveBeenCalled()
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ success: true })
    })
})
