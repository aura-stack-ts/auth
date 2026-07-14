import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { jose } from "@test/presets.ts"
import { createAuth } from "@/createAuth.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import type { DatabaseAdapter, IdentityConfig, SessionEntity, UserEntity } from "@/@types/index.ts"

describe("Stateful Strategy", () => {
    const mockUser: UserEntity = {
        id: "user-123",
        name: "John Doe",
        email: "john@example.com",
        image: "https://example.com/image.jpg",
        emailVerifiedAt: new Date(),
        status: "active",
        mfaEnabled: false,
        mfaPreferredMethod: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        attributes: null,
    }

    const mockSession: SessionEntity & { user: UserEntity } = {
        id: "session-123",
        userId: "user-123",
        deviceId: null,
        authenticatedWith: "credentials",
        status: "active",
        mfaState: "none",
        tokenHash: "hashed-token",
        expiresAt: new Date(Date.now() + 3600 * 1000),
        metadata: null,
        lastActivityAt: new Date(),
        revokedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-03-24T00:00:00Z"))
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.resetAllMocks()
        vi.clearAllMocks()
    })

    const authInstance = (
        functions: Partial<Record<keyof DatabaseAdapter, any>>,
        identityConfig: Partial<IdentityConfig<any>> = {}
    ) => {
        const { handlers } = createAuth({
            oauth: [],
            session: {
                strategy: "database",
                adapter: functions as any,
            },
            credentials: {
                authorize: async ({ credentials }) => ({
                    sub: "user-123",
                    name: credentials.username,
                    email: credentials.password,
                    image: "https://example.com/image.jpg",
                }),
            },
            logger: true,
            identity: identityConfig,
        })
        return handlers
    }

    describe("getSession", () => {
        test("should return session when valid token exists", async () => {
            const registry = createSchemaRegistry({})
            const module = await import("@/validator/registry.ts")

            const spy = vi.spyOn(registry, "parse")
            vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

            const mock = vi.fn().mockResolvedValue(mockSession)
            const { GET } = authInstance({
                getSessionByToken: mock,
            })
            const response = await GET(
                new Request("https://example.com/auth/session", {
                    headers: {
                        Cookie: "__Secure-aura-auth.session_token=valid-token",
                    },
                })
            )
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                session: {
                    user: {
                        sub: "user-123",
                        name: "John Doe",
                        email: "john@example.com",
                        image: "https://example.com/image.jpg",
                    },
                    expires: mockSession.expiresAt.toISOString(),
                },
                success: true,
            })
            expect(mock).toHaveBeenCalledWith("valid-token")
            expect(spy).toHaveBeenCalledWith({ sub: mockUser.id, ...mockUser, ...mockUser.attributes })
        })

        test("should return null session when token not found", async () => {
            const mock = vi.fn().mockResolvedValue(null)
            const { GET } = authInstance({
                getSessionByToken: mock,
            })
            const response = await GET(
                new Request("https://example.com/auth/session", {
                    headers: {
                        Cookie: "__Secure-aura-auth.session_token=invalid-token",
                    },
                })
            )
            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                session: null,
                success: false,
            })
            expect(mock).toHaveBeenCalledWith("invalid-token")
        })

        test("should return null session when session has no user", async () => {
            const mock = vi.fn().mockResolvedValue({
                ...mockSession,
                user: null as any,
            })
            const { GET } = authInstance({
                getSessionByToken: mock,
            })
            const response = await GET(
                new Request("https://example.com/auth/session", {
                    headers: {
                        Cookie: "__Secure-aura-auth.session_token=token-without-user",
                    },
                })
            )
            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                session: null,
                success: false,
            })
            expect(mock).toHaveBeenCalledWith("token-without-user")
        })

        test("should return null session on adapter error", async () => {
            const mock = vi.fn().mockResolvedValue(new Error("DB Error"))
            const { GET } = authInstance({
                getSessionByToken: mock,
            })
            const response = await GET(
                new Request("https://example.com/auth/session", {
                    headers: {
                        Cookie: "__Secure-aura-auth.session_token=error-token",
                    },
                })
            )
            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                session: null,
                success: false,
            })
            expect(mock).toHaveBeenCalledWith("error-token")
        })

        test("should skip validation when identity.skipValidation is true", async () => {
            const registry = createSchemaRegistry({})
            const module = await import("@/validator/registry.ts")

            const spy = vi.spyOn(registry, "parse")
            vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

            const mock = vi.fn().mockResolvedValue(mockSession)
            const { GET } = authInstance(
                {
                    getSessionByToken: mock,
                },
                { skipValidation: true }
            )
            const response = await GET(
                new Request("https://example.com/auth/session", {
                    headers: {
                        Cookie: "__Secure-aura-auth.session_token=valid-token",
                    },
                })
            )
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                session: {
                    user: {
                        ...mockUser,
                        sub: "user-123",
                        createdAt: mockUser.createdAt.toISOString(),
                        updatedAt: mockUser.updatedAt.toISOString(),
                        emailVerifiedAt: mockUser.emailVerifiedAt?.toISOString(),
                    },
                    expires: mockSession.expiresAt.toISOString(),
                },
                success: true,
            })
            expect(mock).toHaveBeenCalledWith("valid-token")
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe("createSession", () => {
        test("should create a hashed session token", async () => {
            const csrfToken = await createCSRF(jose)

            const mock = vi.fn().mockResolvedValue("hashed-token")

            const { POST } = authInstance({
                createSession: mock,
            })
            const response = await POST(
                new Request("https://example.com/auth/signIn/credentials", {
                    method: "POST",
                    body: JSON.stringify({ username: "John Doe", password: "john@example.com" }),
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
            )
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(mock).toHaveBeenCalledWith({
                id: expect.any(String),
                userId: "user-123",
                deviceId: null,
                authenticatedWith: "credentials",
                status: "active",
                mfaState: "none",
                tokenHash: expect.any(String),
                expiresAt: expect.any(Date),
                metadata: null,
            })
        })

        test("should log when identity validation is disabled", async () => {
            const registry = createSchemaRegistry({})
            const module = await import("@/validator/registry.ts")

            const spy = vi.spyOn(registry, "parse")
            vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

            const csrfToken = await createCSRF(jose)
            const mock = vi.fn().mockResolvedValue("hashed-token")

            const { POST } = authInstance(
                {
                    createSession: mock,
                },
                { skipValidation: true }
            )

            const response = await POST(
                new Request("https://example.com/auth/signIn/credentials", {
                    method: "POST",
                    body: JSON.stringify({ username: "John Doe", password: "john@example.com" }),
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
            )
            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(mock).toHaveBeenCalledWith({
                id: expect.any(String),
                userId: "user-123",
                deviceId: null,
                authenticatedWith: "credentials",
                status: "active",
                mfaState: "none",
                tokenHash: expect.any(String),
                expiresAt: expect.any(Date),
                metadata: null,
            })
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe("refreshSession", () => {
        test("should refresh session with valid token using createAuth", async () => {
            const registry = createSchemaRegistry({})
            const module = await import("@/validator/registry.ts")

            const spy = vi.spyOn(registry, "parse")
            vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

            const getSessionMock = vi.fn().mockResolvedValue(mockSession)
            const updateSessionMock = vi.fn().mockResolvedValue(mockSession)
            const touchSessionMock = vi.fn().mockResolvedValue(undefined)

            const { PATCH } = authInstance({
                getSessionByToken: getSessionMock,
                updateSession: updateSessionMock,
                touchSession: touchSessionMock,
            })

            const csrfToken = await createCSRF(jose)
            const response = await PATCH(
                new Request("https://example.com/auth/session", {
                    method: "PATCH",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: { name: "Updated Name" },
                    }),
                })
            )

            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                session: {
                    user: {
                        sub: "user-123",
                        name: "John Doe",
                        email: "john@example.com",
                        image: "https://example.com/image.jpg",
                    },
                    expires: expect.any(String),
                },
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(getSessionMock).toHaveBeenCalledWith("valid-token")
            expect(updateSessionMock).toHaveBeenCalled()
            expect(touchSessionMock).toHaveBeenCalled()
            expect(spy).toHaveBeenCalledWith({ sub: mockUser.id, ...mockUser, ...mockUser.attributes })
        })

        test("should return null session when token not found using createAuth", async () => {
            const getSessionMock = vi.fn().mockResolvedValue(null)
            const { PATCH } = authInstance({
                getSessionByToken: getSessionMock,
            })

            const csrfToken = await createCSRF(jose)
            const response = await PATCH(
                new Request("https://example.com/auth/session", {
                    method: "PATCH",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=invalid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: { name: "Updated Name" },
                    }),
                })
            )

            expect(response.status).toBe(400)
            expect(await response.json()).toEqual({
                session: null,
                success: false,
                redirect: false,
                redirectURL: null,
            })
            expect(getSessionMock).toHaveBeenCalledWith("invalid-token")
        })

        test("should revoke expired sessions using createAuth", async () => {
            const expiredSession = {
                ...mockSession,
                expiresAt: new Date(Date.now() - 1000),
            }

            const getSessionMock = vi.fn().mockResolvedValue(expiredSession)
            const revokeSessionMock = vi.fn().mockResolvedValue(undefined)

            const { PATCH } = authInstance({
                getSessionByToken: getSessionMock,
                revokeSession: revokeSessionMock,
            })

            const csrfToken = await createCSRF(jose)
            const response = await PATCH(
                new Request("https://example.com/auth/session", {
                    method: "PATCH",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=expired-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: { name: "Updated Name" },
                    }),
                })
            )

            expect(response.status).toBe(400)
            expect(await response.json()).toEqual({
                session: null,
                success: false,
                redirect: false,
                redirectURL: null,
            })
            expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
        })

        test("should skip validation when identity.skipValidation is true using createAuth", async () => {
            const registry = createSchemaRegistry({})
            const module = await import("@/validator/registry.ts")

            const spy = vi.spyOn(registry, "parse")
            vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

            const getSessionMock = vi.fn().mockResolvedValue(mockSession)
            const updateSessionMock = vi.fn().mockResolvedValue(mockSession)
            const touchSessionMock = vi.fn().mockResolvedValue(undefined)

            const { PATCH } = authInstance(
                {
                    getSessionByToken: getSessionMock,
                    updateSession: updateSessionMock,
                    touchSession: touchSessionMock,
                },
                { skipValidation: true }
            )

            const csrfToken = await createCSRF(jose)
            const response = await PATCH(
                new Request("https://example.com/auth/session", {
                    method: "PATCH",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        user: { name: "Updated Name" },
                    }),
                })
            )

            expect(response.status).toBe(200)
            expect(await response.json()).toEqual({
                session: {
                    user: {
                        ...mockUser,
                        sub: "user-123",
                        createdAt: mockUser.createdAt.toISOString(),
                        updatedAt: mockUser.updatedAt.toISOString(),
                        emailVerifiedAt: mockUser.emailVerifiedAt?.toISOString(),
                    },
                    expires: expect.any(String),
                },
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(getSessionMock).toHaveBeenCalledWith("valid-token")
            expect(updateSessionMock).toHaveBeenCalled()
            expect(touchSessionMock).toHaveBeenCalled()
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe("revokeSession", () => {
        test("should revoke session by ID using createAuth", async () => {
            const revokeSessionMock = vi.fn().mockResolvedValue(undefined)

            const { POST } = authInstance({
                revokeSession: revokeSessionMock,
                getSessionByToken: vi.fn().mockResolvedValue(mockSession),
            })

            const csrfToken = await createCSRF(jose)
            const response = await POST(
                new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; __Secure-aura-auth.session_token=valid-token`,
                    },
                })
            )

            expect(response.status).toBe(202)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(revokeSessionMock).toHaveBeenCalled()
        })
    })

    describe("destroySession", () => {
        test("should clear cookies and revoke session using createAuth", async () => {
            const getSessionMock = vi.fn().mockResolvedValue(mockSession)
            const revokeSessionMock = vi.fn().mockResolvedValue(undefined)

            const { POST } = authInstance({
                getSessionByToken: getSessionMock,
                revokeSession: revokeSessionMock,
            })

            const csrfToken = await createCSRF(jose)
            const response = await POST(
                new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Secure-aura-auth.session_token=valid-token; __Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
            )

            expect(response.status).toBe(202)
            expect(await response.json()).toEqual({
                success: true,
                redirect: false,
                redirectURL: null,
            })
            expect(getSessionMock).toHaveBeenCalledWith("valid-token")
            expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
        })

        test("should handle missing session token using createAuth", async () => {
            const getSessionMock = vi.fn().mockResolvedValue(null)
            const revokeSessionMock = vi.fn().mockResolvedValue(undefined)

            const { POST } = authInstance({
                getSessionByToken: getSessionMock,
                revokeSession: revokeSessionMock,
            })

            const csrfToken = await createCSRF(jose)
            const response = await POST(
                new Request("https://example.com/auth/signOut?token_type_hint=session_token", {
                    method: "POST",
                    headers: {
                        "X-CSRF-Token": csrfToken,
                        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}`,
                    },
                })
            )

            expect(response.status).toBe(401)
            expect(await response.json()).toEqual({
                success: false,
                redirect: false,
                redirectURL: null,
            })
            expect(getSessionMock).not.toHaveBeenCalled()
            expect(revokeSessionMock).not.toHaveBeenCalled()
        })
    })
})
