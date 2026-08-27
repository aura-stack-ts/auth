import { describe, test, expect, vi } from "vitest"
import { authInstance, deviceEntity, jose, sessionEntityWithUser, userEntity } from "@test/presets.ts"
import { createCSRF, createClientIdToken } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

describe("signInCredentials action", async () => {
    const csrfToken = await createCSRF(jose)
    const clientId = await createClientIdToken(jose)

    const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken,
        Cookie: `aura-auth.csrf_token=${csrfToken}; aura-auth.client_id_token=${clientId}`,
    }

    test("success signIn flow", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const updateUserMock = vi.fn()
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { handlers } = authInstance({
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
            createDevice: createDeviceMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
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
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { handlers } = authInstance(
            {
                createUser: createUserMock,
                updateUser: updateUserMock,
                getUserById: getUserByIdMock,
                createSession: createSessionMock,
                getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { handlers } = authInstance({
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
            createDevice: createDeviceMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
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
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
            createDevice: createDeviceMock,
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
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
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
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
            createDevice: createDeviceMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
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
        const getUserByIdMock = vi.fn().mockReturnValue(userEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { handlers } = authInstance({
            updateUser: updateUserMock,
            getUserById: getUserByIdMock,
            createSession: createSessionMock,
            createDevice: createDeviceMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(createSessionMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: "user-123",
            deviceId: "device-123",
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: expect.any(String),
            expiresAt: expect.any(Date),
            metadata: null,
        })
    })
})
