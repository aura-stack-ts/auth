import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { authInstance, jose, sessionEntityWithUser, userEntity } from "@test/presets.ts"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

beforeEach(() => {
    vi.stubEnv("BASE_URL", undefined)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

vi.mock("@aura-stack/rate-limiter", async () => {
    const actual = await vi.importActual<typeof import("@aura-stack/rate-limiter")>("@aura-stack/rate-limiter")
    return {
        ...actual,
        createRateLimiter: (...args: Parameters<typeof actual.createRateLimiter>) => {
            const limiters = actual.createRateLimiter(...args)

            for (const limiter of Object.values(limiters)) {
                limiter.check = vi.fn().mockResolvedValue({
                    ok: true,
                    limit: Number.MAX_SAFE_INTEGER,
                    remaining: Number.MAX_SAFE_INTEGER,
                    resetAt: Date.now() + 60000,
                    retryAfter: 0,
                    toResponse: () => new Response(),
                })
            }

            return limiters
        },
    }
})

describe("signInCredentials action", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signIn flow", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })
        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            sub: "user-123",
            name: "johndoe",
            email: "johndoe@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "johndoe@example.com",
            name: "johndoe",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
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

    test("invalid credentials", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                credentials: {
                    authorize: () => null,
                },
            }
        )
        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "wrongpassword",
                }),
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("invalid authorize by missing required fields", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                credentials: {
                    authorize: () =>
                        ({
                            name: "John Doe",
                            email: "johndoe@example.com",
                        }) as any,
                },
            }
        )

        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "johndoe",
                    password: "1234567890",
                } as any),
            })
        )
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            name: "John Doe",
            email: "johndoe@example.com",
        })
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("credentials with redirect: true (by default)", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            sub: "user-123",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "alice@example.com",
            name: "alice",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
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

    test("credentials with redirect: true and redirectTo", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            sub: "user-123",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "alice@example.com",
            name: "alice",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
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

    test("credentials with redirect: false", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirect=false", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            sub: "user-123",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "alice@example.com",
            name: "alice",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
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

    test("credentials with redirect: false and redirectTo", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const response = await handlers.POST(
            new Request("http://localhost:3000/auth/signIn/credentials?redirect=false&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    username: "alice",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })

        expect(spyParse).toHaveBeenCalledWith({
            sub: "user-123",
            name: "alice",
            email: "alice@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "alice@example.com",
            name: "alice",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
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
})
