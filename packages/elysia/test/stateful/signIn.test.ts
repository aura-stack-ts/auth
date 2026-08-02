import { adapter, app, prismaClient } from "@test/stateful/app"
import { describe, test, expect, vi } from "vitest"
import { createHash } from "@aura-stack/auth/crypto"
import { parseSetCookie } from "@aura-stack/auth/cookies"
import { getSessionToken } from "@test/utils"

describe("signIn (Stateful)", () => {
    test("redirects to GitHub's OAuth page", async () => {
        expect(await prismaClient.oAuthTransaction.count()).toBe(0)
        const response = await app.handle(new Request("http://localhost:3000/api/auth/signIn/github"))
        expect(response.status).toBe(302)
        expect(response.headers.get("location")).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/)
        const transaction = await prismaClient.oAuthTransaction.findFirst({
            where: {
                provider: "github",
            },
        })
        expect(transaction?.provider).toBe("github")
    })

    test("handles GitHub OAuth callback and creates a session", async () => {
        const mockFetch = vi.fn()

        vi.stubGlobal("fetch", mockFetch)

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => ({
                access_token: "access_token_123",
                token_type: "bearer",
                scope: "read:user",
                expires_in: 3600,
            }),
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => ({
                id: 123456,
                name: "John Doe",
                login: "johndoe",
                email: "john.doe@example.com",
                avatar_url: "https://john.doe/avatar.png",
            }),
        })

        await adapter.createOAuthTransaction({
            id: "transaction-123",
            provider: "github",
            state: "state-123",
            codeVerifier: "code-verifier-123",
            redirectURI: "http://localhost:3000/api/auth/signIn/github/callback",
            createdAt: new Date(),
            deviceId: null,
            expiresAt: new Date(Date.now() + 60000),
            nonce: null,
            fingerprint: null,
            metadata: null,
            redirectTo: null,
            userAgent: null,
        })
        const response = await app.handle(
            new Request("http://localhost:3000/api/auth/callback/github?code=valid-code&state=state-123", {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            })
        )
        const { cookie, tokenValue } = getSessionToken(response)
        expect(cookie).toBeDefined()

        expect(mockFetch).toHaveBeenNthCalledWith(1, "https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "test-github-client-id",
                client_secret: "test-github-client-secret",
                code: "valid-code",
                redirect_uri: "http://localhost:3000/api/auth/signIn/github/callback",
                grant_type: "authorization_code",
                code_verifier: "code-verifier-123",
            }).toString(),
            signal: expect.any(AbortSignal),
        })
        expect(mockFetch).toHaveBeenNthCalledWith(2, "https://api.github.com/user", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/0.8.1`,
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
            signal: expect.any(AbortSignal),
        })

        const session = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                headers: { Cookie: `aura-auth.session_token=${tokenValue}` },
            })
        )
        expect(session.status).toBe(200)
        expect(await session.json()).toEqual({
            success: true,
            session: {
                user: {
                    sub: expect.any(String),
                    name: "John Doe",
                    email: "john.doe@example.com",
                    image: "https://john.doe/avatar.png",
                },
                expires: expect.any(String),
            },
        })
    })

    test("handles GitHub OAuth callback when there is an existing account", async () => {
        const mockFetch = vi.fn()
        vi.stubGlobal("fetch", mockFetch)

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => ({
                access_token: "access_token_123",
                token_type: "bearer",
                scope: "read:user",
                expires_in: 3600,
            }),
        })

        mockFetch.mockResolvedValueOnce({
            ok: true,
            headers: new Headers({
                "Content-Type": "application/json",
            }),
            json: async () => ({
                id: "user-1234",
                name: "John Doe",
                login: "johndoe",
                email: "john.doe@example.com",
                avatar_url: "https://john.doe/avatar.png",
            }),
        })

        await adapter.createOAuthTransaction({
            id: "transaction-123",
            provider: "github",
            state: "state-123",
            codeVerifier: "code-verifier-123",
            redirectURI: "http://localhost:3000/api/auth/signIn/github/callback",
            createdAt: new Date(),
            deviceId: null,
            expiresAt: new Date(Date.now() + 60000),
            nonce: null,
            fingerprint: null,
            metadata: null,
            redirectTo: null,
            userAgent: null,
        })

        const user = await adapter.createUser({
            id: "user-123",
            name: "John Doe",
            email: "john.doe@example.com",
        })

        const tokenHash = await createHash("valid-token-hash")
        await adapter.createSession({
            id: "session-123",
            userId: user.id,
            authenticatedWith: "oauth",
            deviceId: null,
            expiresAt: new Date(Date.now() + 3600000),
            metadata: null,
            mfaState: "none",
            status: "active",
            tokenHash,
        })

        const account = await adapter.createAccount({
            userId: user.id,
            provider: "google",
            providerUserId: "sub-1234",
            status: "active",
            type: "oauth",
        })

        await adapter.createOAuthAccount({
            accountId: account.id,
            accessToken: "access-token-google",
            refreshToken: "refresh-token-google",
        })

        const request = await app.handle(
            new Request("http://localhost:3000/api/auth/callback/github?code=valid-code&state=state-123", {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            })
        )

        expect(mockFetch).toHaveBeenNthCalledWith(1, "https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: "test-github-client-id",
                client_secret: "test-github-client-secret",
                code: "valid-code",
                redirect_uri: "http://localhost:3000/api/auth/signIn/github/callback",
                grant_type: "authorization_code",
                code_verifier: "code-verifier-123",
            }).toString(),
            signal: expect.any(AbortSignal),
        })
        expect(mockFetch).toHaveBeenNthCalledWith(2, "https://api.github.com/user", {
            method: "GET",
            headers: {
                "User-Agent": `Aura Auth/0.8.1`,
                Accept: "application/json",
                Authorization: "Bearer access_token_123",
            },
            signal: expect.any(AbortSignal),
        })

        const sessionToken = request.headers.getSetCookie()?.find((cookie) => cookie.startsWith("aura-auth.session_token="))
        expect(sessionToken).toBeDefined()

        const parsed = parseSetCookie(sessionToken!)
        const session = await app.handle(
            new Request("http://localhost:3000/api/auth/session", {
                headers: { Cookie: `aura-auth.session_token=${parsed.value}` },
            })
        )
        expect(session.status).toBe(200)
        expect(await session.json()).toEqual({
            success: true,
            session: {
                user: {
                    sub: expect.any(String),
                    name: "John Doe",
                    email: "john.doe@example.com",
                    image: "https://john.doe/avatar.png",
                },
                expires: expect.any(String),
            },
        })

        const googleConnected = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/google", {
                headers: { Cookie: `aura-auth.session_token=valid-token-hash` },
            })
        )
        expect(googleConnected.status).toBe(200)
        expect(await googleConnected.json()).toEqual({
            success: true,
            connected: true,
        })

        const githubConnected = await app.handle(
            new Request("http://localhost:3000/api/auth/providers/github", {
                headers: { Cookie: `aura-auth.session_token=${parsed.value}` },
            })
        )
        expect(githubConnected.status).toBe(200)
        expect(await githubConnected.json()).toEqual({
            success: true,
            connected: true,
        })
        const users = await prismaClient.user.findMany()
        expect(users.length).toBe(1)
    })
})
