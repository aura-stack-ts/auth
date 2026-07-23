import { describe, test, expect, vi } from "vitest"
import { z } from "zod/v4"
import { createCSRF } from "@/shared/crypto.ts"
import { identitySchema } from "@/identity/zod.ts"
import { authInstance, jose, sessionEntityWithUser, sessionPayload, userEntity } from "@test/presets.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

describe("signUp API", async () => {
    const csrfToken = await createCSRF(jose)

    const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: `__Host-aura-auth.csrf_token=${csrfToken}; Secure; HttpOnly; SameSite=Strict; Path=/`,
    }

    test("success signUp flow not already exists", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createSession: createSessionMock,
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
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

    test("success signUp flow already exists", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const createUserMock = vi.fn()
        const updateUserMock = vi.fn().mockReturnValue(userEntity)
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            createSession: createSessionMock,
            createUser: createUserMock,
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
        })

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john@example.com",
            name: "John Doe",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
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
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                signUp: {
                    onCreateUser: () => null,
                },
            }
        )

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("invalid signUp.onCreateUser return with custom schema", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                signUp: {
                    schema: z.object({
                        name: z.string(),
                        lastName: z.string(),
                        email: z.string().email(),
                        password: z.string(),
                    }),
                    onCreateUser: () => null,
                },
            }
        )

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    password: "1234567890",
                }),
            })
        )
        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({
            type: "VALIDATION",
            code: "UNPROCESSABLE_ENTITY",
            message: "The request body or parameter schema layout contains input format errors.",
            details: {
                email: {
                    code: "invalid_type",
                    message: "Invalid input: expected string, received undefined",
                },
            },
        })

        expect(spyParse).not.toHaveBeenCalled()
        expect(createUserMock).not.toHaveBeenCalled()
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    test("valid signUp.onCreateUser return with custom schema", async () => {
        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                signUp: {
                    schema: z.object({
                        name: z.string(),
                        lastName: z.string(),
                        email: z.string().email(),
                        password: z.string(),
                    }),
                    onCreateUser: ({ payload }) => ({
                        sub: "1234567890",
                        email: payload.email,
                        name: payload.name,
                        image: "https://example.com/image.jpg",
                    }),
                },
            }
        )

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    email: "john@example.com",
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

        expect(getUserByIdMock).toHaveBeenCalledWith("1234567890")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "1234567890",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
    })

    test("valid signUp.onCreateUser return with custom schema and identity.schema", async () => {
        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
            },
            {
                identity: {
                    // @ts-ignore @todo fix this type issue
                    schema: identitySchema.extend({
                        role: z.string(),
                    }),
                },
                signUp: {
                    schema: z.object({
                        name: z.string(),
                        lastName: z.string(),
                        email: z.string().email(),
                        password: z.string(),
                    }),
                    onCreateUser: ({ payload }) => ({
                        sub: "1234567890",
                        email: payload.email,
                        name: payload.name,
                        image: "https://example.com/image.jpg",
                        role: "user",
                    }),
                },
            }
        )

        const response = await handlers.POST(
            new Request("https://example.com/auth/signUp", {
                method: "POST",
                headers,
                body: JSON.stringify({
                    name: "John Doe",
                    lastName: "Doe",
                    email: "john@example.com",
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
        expect(getUserByIdMock).toHaveBeenCalledWith("1234567890")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "1234567890",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {
                role: "user",
            },
        })
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "1234567890",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
    })

    test("signUp with redirect: true and redirectTo", async () => {
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
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/dashboard")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
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

    test("signUp with redirect: false", async () => {
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
            new Request("https://example.com/auth/signUp?redirect=false", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: null,
        })

        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
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

    test("signUp with redirect: false and redirectTo", async () => {
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
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=/dashboard", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
        })

        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
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

    test("signUp with redirect: true and invalid redirectTo", async () => {
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
            new Request("https://example.com/auth/signUp?redirect=true&redirectTo=http://malicious.com", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/")
        expect(await response.json()).toEqual({
            success: true,
            redirect: true,
            redirectURL: null,
        })

        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
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

    test("signUp with redirect: false and invalid redirectTo", async () => {
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
            new Request("https://example.com/auth/signUp?redirect=false&redirectTo=http://malicious.com", {
                method: "POST",
                headers,
                body: JSON.stringify(sessionPayload),
            })
        )
        expect(response.status).toBe(200)
        expect(response.headers.get("Location")).toBeNull()
        expect(await response.json()).toEqual({
            success: true,
            redirect: false,
            redirectURL: "/",
        })

        expect(getUserByIdMock).toHaveBeenCalledWith("user-123")
        expect(createUserMock).toHaveBeenCalledWith({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
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
