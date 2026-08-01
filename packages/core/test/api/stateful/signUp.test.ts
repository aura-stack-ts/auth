import { describe, test, expect, vi } from "vitest"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import {
    accountEntity,
    authInstance,
    deviceEntity,
    jose,
    sessionEntityWithUser,
    sessionPayload,
    userEntity,
} from "@test/presets.ts"
import type { User } from "@/index.ts"

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

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createAccount: createAccountMock,
            createUser: createUserMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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

    test("signUp with existing email", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(userEntity)
        const createAccountMock = vi.fn()
        const createUserMock = vi.fn()
        const createDeviceMock = vi.fn()
        const createSessionMock = vi.fn()
        const getDeviceByFingerprintMock = vi.fn()

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createUser: createUserMock,
            createAccount: createAccountMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
        })

        const output = await api.signUp({
            headers,
            payload: sessionPayload,
        })
        expect(output).toEqual({
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "EMAIL_ALREADY_REGISTERED",
                message: "This email address is already registered. Please sign in or use a different email.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(spy).toHaveBeenCalledWith({
            ...sessionPayload,
            sub: "user-123",
        })
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).not.toHaveBeenCalled()
        expect(createAccountMock).not.toHaveBeenCalled()
        expect(createDeviceMock).not.toHaveBeenCalled()
        expect(createSessionMock).not.toHaveBeenCalled()
    })

    /**
     * @todo fix wrong logic from identity.schema (User schema) and signUp.schema (SignUpPayload schema)
     */
    test("signUp including password", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createCredentialsAccountMock = vi.fn()
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance(
            {
                getUserByEmail: getUserByEmailMock,
                createUser: createUserMock,
                createAccount: createAccountMock,
                createCredentialAccount: createCredentialsAccountMock,
                createDevice: createDeviceMock,
                createSession: createSessionMock,
                getDeviceByFingerprint: getDeviceByFingerprintMock,
            },
            { signUp: { onCreateUser: ({ payload }) => payload } }
        )

        const output = await api.signUp({
            headers,
            payload: {
                ...sessionPayload,
                password: "secure-password-123",
            },
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
            sub: "1234567890",
            password: "secure-password-123",
        })
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
        expect(createCredentialsAccountMock).toHaveBeenCalledWith({
            accountId: "account-123",
            passwordHash: expect.any(String),
        })
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

    test("signUp with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createUser: createUserMock,
            createAccount: createAccountMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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

    test("signUp with redirect: true and absolute redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createAccount: createAccountMock,
            createUser: createUserMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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

    test("signUp with redirect: false and valid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            createUser: createUserMock,
            getUserByEmail: getUserByEmailMock,
            createAccount: createAccountMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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

    test("signUp redirect: true and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            getUserByEmail: getUserByEmailMock,
            createAccount: createAccountMock,
            createUser: createUserMock,
            createDevice: createDeviceMock,
            createSession: createSessionMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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

    test("signUp redirect: false and invalid redirectTo", async () => {
        vi.stubEnv("BASE_URL", "https://example.com")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const getUserByIdMock = vi.fn().mockReturnValue(null)
        const createUserMock = vi.fn().mockReturnValue(userEntity)
        const getUserByEmailMock = vi.fn().mockReturnValue(null)
        const createAccountMock = vi.fn().mockReturnValue({
            ...accountEntity,
            provider: "credentials",
        })
        const createDeviceMock = vi.fn().mockResolvedValue(deviceEntity)
        const createSessionMock = vi.fn().mockReturnValue(sessionEntityWithUser)
        const getDeviceByFingerprintMock = vi.fn().mockReturnValue(null)

        const { api } = authInstance({
            createUser: createUserMock,
            getUserById: getUserByIdMock,
            createDevice: createDeviceMock,
            createAccount: createAccountMock,
            createSession: createSessionMock,
            getUserByEmail: getUserByEmailMock,
            getDeviceByFingerprint: getDeviceByFingerprintMock,
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
        expect(getUserByEmailMock).toHaveBeenCalledWith("john@example.com")
        expect(createUserMock).toHaveBeenCalledWith({
            id: expect.any(String),
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            attributes: {},
            status: "active",
            mfaEnabled: false,
            mfaPreferredMethod: null,
            emailVerifiedAt: null,
        })
        expect(createAccountMock).toHaveBeenCalledWith({
            id: expect.any(String),
            userId: expect.any(String),
            provider: "credentials",
            providerUserId: expect.any(String),
            type: "credentials",
            status: "active",
        })
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
