import { describe, test, expect } from "vitest"
import { adapter, app } from "@test/stateful/app"
import { createHash } from "@aura-stack/auth/crypto"

describe("isProviderConnected (Stateful)", () => {
    test("returns 401 when no session cookie is present", async () => {
        const response = await app.handle(new Request("http://localhost:3000/api/auth/providers/github"))
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            connected: false,
        })
    })

    test("returns false when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "Not Connected User",
            email: "notconnected@example.com",
        })
        const sessionToken = "session-token-notconnected"
        const tokenHash = await createHash(sessionToken)
        await adapter.createSession({
            id: "session-notconnected",
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
            new Request("http://localhost:3000/api/auth/providers/github", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toMatchObject({
            success: true,
            connected: false,
        })
    })

    test("returns false when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const sessionToken = "session-token-connected"
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

        /**
         * The user sign-up with credentials, so there's no OAuth account connected yet.
         */
        await adapter.createAccount({
            id: "account-1",
            userId: user.id,
            type: "credentials",
            provider: "credentials",
            providerUserId: "credentials-user-1",
            status: "active",
        })

        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })

    test("returns false when account is unlinked", async () => {
        const user = await adapter.createUser({
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const sessionToken = "session-token-connected"
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
            provider: "github",
            providerUserId: "github-user-1",
            status: "unlinked",
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
            new Request("http://localhost:3000/api/auth/providers/github", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: false,
        })
    })
    test("returns true when provider is connected", async () => {
        const user = await adapter.createUser({
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const sessionToken = "session-token-connected"
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
            provider: "github",
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
            new Request("http://localhost:3000/api/auth/providers/github", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            connected: true,
        })
    })
})
