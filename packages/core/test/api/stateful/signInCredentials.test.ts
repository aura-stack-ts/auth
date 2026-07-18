import { describe, test, expect, beforeEach, afterEach, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { authInstance, jose, userEntity } from "@test/presets.ts"
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

describe("signInCredentials API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        Cookie: `aura-auth.csrf_token=${csrfToken}`,
    }

    test("success signIn flow", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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

    test("invalid authorize return", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const createSessionMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)

        const { api } = authInstance(
            {
                updateUser: updateUserMock,
                createUser: createUserMock,
                createSession: createSessionMock,
                getUserById: getUserByIdMock,
            },
            { credentials: { authorize: () => null } }
        )
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "wrongpassword",
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "AUTH_CREDENTIALS_INVALID",
                message: "The user's session couldn't be established with the provided credentials.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(spyParse).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("invalid authorize by missing required fields", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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
                credentials: {
                    authorize: () =>
                        ({
                            name: "John Doe",
                            email: "johndoe@example.com",
                        }) as any,
                },
            }
        )
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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
        expect(spyParse).toHaveBeenCalledWith({
            name: "John Doe",
            email: "johndoe@example.com",
        })
        expect(createSessionMock).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
    })

    test("signIn without URL configuration", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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
        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
        })

        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "INVALID_AUTH_CONFIGURATION",
                message: "The application context URL cannot be constructed. Set BASE_URL or provide proxy host headers.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(spyParse).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("signIn with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
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

    test("signIn with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://example.com/dashboard",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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

    test("signIn redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: true,
            redirectTo: "https://malicious.com/phishing",
        })
        expect(output.headers.get("Location")).toBe("/")
        expect(output).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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

    test("signIn with redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
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

        const output = await api.signInCredentials({
            headers,
            payload: {
                username: "johndoe",
                password: "1234567890",
            },
            redirect: false,
            redirectTo: "https://malicious.com/phishing",
        })
        expect(output.headers.get("Location")).toBeNull()
        expect(output).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
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
})
