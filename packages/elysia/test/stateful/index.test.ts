import { describe, test, expect, vi } from "vitest"
import { adapter, app, auth, prismaClient } from "@test/stateful/app"
import { createCSRF } from "@aura-stack/auth/crypto"
import { parseSetCookie } from "@aura-stack/auth/cookies"

describe("GET /api/auth/signIn/github", () => {
    test("redirects to GitHub's OAuth page", async () => {
        expect(await prismaClient.oAuthTransaction.count()).toBe(0)
        const response = await app.handle(new Request("http://localhost/api/auth/signIn/github"))
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
            redirectURI: "http://localhost/api/auth/signIn/github/callback",
            createdAt: new Date(),
            deviceId: null,
            expiresAt: new Date(Date.now() + 60000),
            nonce: null,
            fingerprint: null,
            metadata: null,
            redirectTo: null,
            userAgent: null,
        })
        const request = await app.handle(
            new Request("http://localhost:3000/api/auth/callback/github?code=valid-code&state=state-123", {
                headers: {
                    "User-Agent": "Mozilla/5.0",
                },
            })
        )
        const sessionToken = request.headers.getSetCookie()?.find((cookie) => cookie.startsWith("aura-auth.session_token="))
        expect(sessionToken).toBeDefined()

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
                redirect_uri: "http://localhost/api/auth/signIn/github/callback",
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

        const parsed = parseSetCookie(sessionToken!)
        const session = await app.handle(
            new Request("http://localhost/api/auth/session", {
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
                id: "user-123",
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
            redirectURI: "http://localhost/api/auth/signIn/github/callback",
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

        await adapter.createSession({
            id: "session-123",
            userId: user.id,
            authenticatedWith: "oauth",
            deviceId: null,
            expiresAt: new Date(Date.now() + 3600000),
            metadata: null,
            mfaState: "none",
            status: "active",
            tokenHash: "valid-token-hash",
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
        const sessionToken = request.headers.getSetCookie()?.find((cookie) => cookie.startsWith("aura-auth.session_token="))
        expect(sessionToken).toBeDefined()

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
                redirect_uri: "http://localhost/api/auth/signIn/github/callback",
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

        const parsed = parseSetCookie(sessionToken!)
        const session = await app.handle(
            new Request("http://localhost/api/auth/session", {
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

describe("GET /api/auth/session", () => {
    test("returns 401 when no session cookie is present", async () => {
        const response = await app.handle(new Request("http://localhost/api/auth/session"))
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body).toMatchObject({
            success: false,
            session: null,
        })
    })

    test("returns session data when a valid session cookie is present", async () => {
        const user = await adapter.createUser({
            name: "John Doe",
            email: "john@example.com",
            image: "https://jhon.doe/avatar.png",
        })
        const session = await adapter.createSession({
            id: "session-123",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-123",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })
        const response = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: `aura-auth.session_token=token-hash-123`,
                },
            })
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            session: {
                user: {
                    sub: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                },
                expires: session.expiresAt.toISOString(),
            },
        })
    })
})

describe("POST /api/auth/signIn/credentials", () => {
    test("returns 401 when invalid credentials are provided", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ username: "invalid", password: "invalid" }),
            })
        )
        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })
    })

    test("returns 200 and a session cookie when valid credentials are provided", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ username: "valid", password: "valid" }),
            })
        )
        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        expect(response.headers.get("set-cookie")).toBeDefined()
    })
})

describe("POST /api/auth/signOut", () => {
    test("returns 401 or clears session when no active session cookie is present", async () => {
        const response = await app.handle(
            new Request("http://localhost/api/auth/signOut", {
                method: "POST",
            })
        )
        expect(response.status).toBe(422)
    })

    test("successfully revokes session and clears cookie when a valid session is present", async () => {
        const user = await adapter.createUser({
            name: "SignOut User",
            email: "signout@example.com",
            status: "active",
        })
        const session = await adapter.createSession({
            id: "session-signout-123",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-to-revoke",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-to-revoke; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBe(202)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        const revokedSession = await adapter.getSessionById(session.id)
        expect(revokedSession).toBeNull()
        const setCookie = response.headers.get("set-cookie")
        expect(setCookie).toBeDefined()
        expect(setCookie).toContain("aura-auth.session_token=")
    })
})

describe("POST /api/auth/signUp", () => {
    test("returns 400 or fails when required fields are missing or email is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({ email: "", password: "short" }),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toMatchObject({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: expect.any(Object),
        })
    })

    test("returns 200/201 and creates a user and session cookie when valid payload is provided", async () => {
        const csrfToken = await createCSRF(auth.jose)
        const email = "newuser@example.com"

        const response = await app.handle(
            new Request("http://localhost/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email,
                }),
            })
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })
        expect(response.headers.get("set-cookie")).toBeDefined()

        const createdUser = await adapter.getUserByEmail(email)
        expect(createdUser).toEqual({
            id: expect.any(String),
            name: "John Doe",
            email: `newuser@example.com`,
            image: `https://avatars.dicebear.com/api/identicon/JohnDoe.svg`,
            emailVerifiedAt: null,
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date),
            attributes: {},
        })
    })

    test("fails with invalid CSRF token", async () => {
        const response = await app.handle(
            new Request("http://localhost/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": "invalid-csrf",
                    Cookie: `aura-auth.csrf_token=invalid-csrf`,
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email: "test@example.com",
                }),
            })
        )
        expect(response.status).toBeGreaterThanOrEqual(400)
    })

    test("fails with missing CSRF token", async () => {
        const response = await app.handle(
            new Request("http://localhost/api/auth/signUp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName: "John",
                    lastName: "Doe",
                    email: "test@example.com",
                }),
            })
        )
        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe("POST /api/auth/updateSession", () => {
    test("returns 404 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/updateSession", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )
        expect(response.status).toBe(404)
    })

    test("returns 404 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/updateSession", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid-token; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )
        expect(response.status).toBe(404)
    })

    test("updates session data when valid session is present", async () => {
        const user = await adapter.createUser({
            name: "Update Session User",
            email: "updatesession@example.com",
        })
        await adapter.createSession({
            id: "session-update-123",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-update",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/session", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-update; aura-auth.csrf_token=${csrfToken}`,
                },
                body: JSON.stringify({
                    user: {
                        name: "Updated Name",
                    },
                }),
            })
        )

        expect(response.status).toBe(200)
        const body = await response.json()
        expect(body).toEqual({
            success: true,
            session: {
                user: {
                    sub: user.id,
                    name: "Updated Name",
                    email: user.email,
                    image: user.image,
                },
                expires: expect.any(String),
            },
            redirect: false,
            redirectURL: null,
        })
    })

    test("fails with invalid CSRF token even with valid session", async () => {
        const user = await adapter.createUser({
            name: "CSRF Fail User",
            email: "csrf-fail@example.com",
        })
        await adapter.createSession({
            id: "session-csrf-fail",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-csrf",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost/api/auth/updateSession", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": "invalid",
                    Cookie: `aura-auth.session_token=token-hash-csrf; aura-auth.csrf_token=invalid`,
                },
                body: JSON.stringify({
                    session: {
                        user: {
                            name: "Updated Name",
                        },
                    },
                }),
            })
        )

        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe("GET /api/auth/getProviderTokens", () => {
    test("returns 404 when no session cookie is present", async () => {
        const response = await app.handle(new Request("http://localhost/api/auth/getProviderTokens/github"))
        expect(response.status).toBe(404)
    })

    test("returns 404 when session cookie is invalid", async () => {
        const response = await app.handle(
            new Request("http://localhost/api/auth/getProviderTokens/github", {
                headers: {
                    Cookie: "aura-auth.session_token=invalid-token",
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("returns empty tokens when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "No Provider User",
            email: "noprovider@example.com",
        })
        await adapter.createSession({
            id: "session-noprovider",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-noprovider",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost/api/auth/providers/github/tokens", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-noprovider",
                },
            })
        )

        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body).toMatchObject({
            success: false,
            tokens: null,
        })
    })
})

describe("GET /api/auth/isProviderConnected", () => {
    test("returns 401 when no session cookie is present", async () => {
        const response = await app.handle(new Request("http://localhost/api/auth/isProviderConnected/github"))
        expect(response.status).toBe(404)
    })

    test("returns false when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "Not Connected User",
            email: "notconnected@example.com",
        })
        await adapter.createSession({
            id: "session-notconnected",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-notconnected",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost/api/auth/providers/github", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-notconnected",
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
})

describe("POST /api/auth/disconnectProvider", () => {
    test("returns 401 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/disconnectProvider/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("returns 401 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/disconnectProvider/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("fails when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "Disconnect Fail User",
            email: "disconnectfail@example.com",
        })
        await adapter.createSession({
            id: "session-disconnect-fail",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-disconnect",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/disconnectProvider/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-disconnect; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe("POST /api/auth/revokeToken", () => {
    test("returns 401 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/revokeToken/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("returns 401 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/revokeToken/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })
})

describe("POST /api/auth/refreshUserInfo", () => {
    test("returns 401 when no session cookie is present", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/refreshUserInfo/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("returns 401 when session cookie is invalid", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/refreshUserInfo/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=invalid; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )
        expect(response.status).toBe(404)
    })

    test("fails when provider is not connected", async () => {
        const user = await adapter.createUser({
            name: "Refresh Fail User",
            email: "refreshfail@example.com",
        })
        await adapter.createSession({
            id: "session-refresh-fail",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-refresh",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/refreshUserInfo/github", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-refresh; aura-auth.csrf_token=${csrfToken}`,
                },
            })
        )

        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe("Session expiration edge cases", () => {
    test("returns 401 for expired session", async () => {
        const user = await adapter.createUser({
            name: "Expired Session User",
            email: "expired@example.com",
        })
        await adapter.createSession({
            id: "session-expired",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-expired",
            expiresAt: new Date(Date.now() - 1000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-expired",
                },
            })
        )

        expect(response.status).toBe(401)
    })

    test("returns 401 for revoked session", async () => {
        const user = await adapter.createUser({
            name: "Revoked Session User",
            email: "revoked@example.com",
        })
        await adapter.createSession({
            id: "session-revoked",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-revoked",
            expiresAt: new Date(Date.now() + 3600000),
            status: "revoked",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-revoked",
                },
            })
        )

        expect(response.status).toBe(401)
    })
})

describe("CSRF token validation edge cases", () => {
    test("sign in credentials fails with CSRF token mismatch", async () => {
        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signIn/credentials", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.csrf_token=different-token`,
                },
                body: JSON.stringify({ username: "valid", password: "valid" }),
            })
        )

        expect(response.status).toBeGreaterThanOrEqual(400)
    })

    test("sign out fails with CSRF token mismatch", async () => {
        const user = await adapter.createUser({
            name: "CSRF Mismatch User",
            email: "csrfmismatch@example.com",
        })
        await adapter.createSession({
            id: "session-csrf-mismatch",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-csrf-mismatch",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const csrfToken = await createCSRF(auth.jose)

        const response = await app.handle(
            new Request("http://localhost/api/auth/signOut?token_type_hint=session_token", {
                method: "POST",
                headers: {
                    "X-CSRF-Token": csrfToken,
                    Cookie: `aura-auth.session_token=token-hash-csrf-mismatch; aura-auth.csrf_token=different-token`,
                },
            })
        )

        expect(response.status).toBeGreaterThanOrEqual(400)
    })
})

describe("Multiple concurrent sessions", () => {
    test("handles multiple sessions for same user", async () => {
        const user = await adapter.createUser({
            name: "Multi Session User",
            email: "multisession@example.com",
        })

        await adapter.createSession({
            id: "session-multi-1",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-multi-1",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        await adapter.createSession({
            id: "session-multi-2",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-multi-2",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        const response1 = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-multi-1",
                },
            })
        )

        const response2 = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-multi-2",
                },
            })
        )

        expect(response1.status).toBe(200)
        expect(response2.status).toBe(200)

        expect(await response1.json()).toMatchObject({ session: { user: { sub: user.id } } })
        expect(await response2.json()).toMatchObject({ session: { user: { sub: user.id } } })
    })
})

describe("Deleted user edge cases", () => {
    test("returns 401 for session belonging to deleted user", async () => {
        const user = await adapter.createUser({
            name: "Deleted User",
            email: "deleteduser@example.com",
        })
        await adapter.createSession({
            id: "session-deleted-user",
            userId: user.id,
            authenticatedWith: "credentials",
            tokenHash: "token-hash-deleted-user",
            expiresAt: new Date(Date.now() + 3600000),
            status: "active",
            mfaState: "none",
            deviceId: null,
            metadata: null,
        })

        await adapter.deleteUser(user.id)

        expect(await adapter.getSessionById("session-deleted-user")).toBeNull()
        expect(await adapter.getSessionByToken("token-hash-deleted-user")).toBeNull()

        const response = await app.handle(
            new Request("http://localhost/api/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=token-hash-deleted-user",
                },
            })
        )

        expect(response.status).toBe(401)
    })
})
