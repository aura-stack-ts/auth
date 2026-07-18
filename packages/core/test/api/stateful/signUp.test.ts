import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { authInstance, jose, sessionPayload, userEntity } from "@test/presets.ts"
import type { User } from "@/index.ts"

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

describe("signUp API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signUp flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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

    test("invalid signUp.onCreateUser return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance(
            {
                createSession: createSessionMock,
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
            },
            { signUp: { onCreateUser: () => null } }
        )
        const output = await api.signUp({
            headers,
            payload: sessionPayload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "USER_CREATION_FAILED",
                message: "Failed to create user account with the provided metadata payload.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(spy).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("invalid signUp.onCreateUser by missing required fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                signUp: {
                    onCreateUser: () =>
                        ({
                            name: "John Doe",
                            email: "johndoe@example.com",
                        }) as User,
                },
            }
        )
        const output = await api.signUp({
            headers,
            payload: sessionPayload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "SCHEMA_PARSER_FAILED",
                message:
                    "An internal schema parsing error occurred. Please verify your schema configuration and validation adapter setup.",
            },
            toResponse: expect.any(Function),
        })
        expect(spy).toHaveBeenCalledWith({
            name: "John Doe",
            email: "johndoe@example.com",
        })
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("signUp without URL configuration", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            error: {
                code: "INVALID_AUTH_CONFIGURATION",
                message: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
            },
            toResponse: expect.any(Function),
        })
        expect(spy).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("signUp with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
            redirect: true,
            redirectTo: "/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/dashboard")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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

    test("signUp with redirect: true and absolute redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
            redirect: true,
            redirectTo: "https://example.com/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/dashboard")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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

    test("signUp with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
            redirect: false,
            redirectTo: "/dashboard",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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

    test("signUp redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
            redirect: true,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output.headers.get("Location")).toBe("/")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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

    test("signUp redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance({
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
            redirect: false,
            redirectTo: "https://malicious.com/dashboard",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            email: "john@example.com",
            name: "John Doe",
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
