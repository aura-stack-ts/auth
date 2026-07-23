import { describe, test, expect, vi } from "vitest"
import { z } from "zod/v4"
import { createCSRF } from "@/shared/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { identitySchema as UserIdentity } from "@/identity/zod.ts"
import { authInstance, jose, sessionEntityWithUser, userEntity } from "@test/presets.ts"

describe("updateSession API", () => {
    test("invalid session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const revokeSessionMock = vi.fn()
        const updateSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
        })

        const updated = await api.updateSession({
            headers: new Headers(),
            session: {},
        })
        expect(updated).toEqual({
            session: null,
            headers: expect.any(Headers),
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "UPDATE_SESSION_INVALID",
                message: "Failed to update session parameters.",
            },
            toResponse: expect.any(Function),
        })
        expect(spy).not.toHaveBeenCalled()
        expect(sessionByTokenMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
    })

    test("updates user session with skipCSRFCheck", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: newUser,
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(newUser)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            ...newUser,
            sub: "user-123",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", newUser)
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("updates user session with disabled skipCSRFCheck", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const newUser = {
            name: "Alice Smith",
            email: "alicesmith@example.com",
            image: "https://example.com/alicesmith-avatar.jpg",
        }

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": csrfToken,
            }),
            session: {
                user: newUser,
            },
            skipCSRFCheck: false,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    ...newUser,
                },
                expires: expect.any(String),
            },
            headers: expect.any(Headers),
            redirect: false,
            redirectURL: null,
            success: true,
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(newUser)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            ...newUser,
            sub: "user-123",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", newUser)
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("updates user session with generic user type", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const extendedIdentitySchema = UserIdentity.extend({
            role: z.string(),
            department: z.string(),
        })

        const registry = createSchemaRegistry({
            schema: extendedIdentitySchema,
        })
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()

        const userEntityWithAttributes = {
            ...userEntity,
            attributes: {
                role: "admin",
                department: "Engineering",
            },
        }

        const sessionByTokenMock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            user: userEntityWithAttributes,
        })
        const { api, jose } = authInstance(
            {
                getSessionByToken: sessionByTokenMock,
                revokeSession: revokeSessionMock,
                updateSession: updateSessionMock,
                touchSession: touchSessionMock,
                updateUser: updateUserMock,
            },
            {
                logger: true,
                identity: {
                    // @ts-ignore
                    schema: extendedIdentitySchema,
                },
            }
        )

        const payload = {
            role: "superadmin",
            department: "Executive",
        }
        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: payload as any,
            },
            skipCSRFCheck: true,
        })

        expect(updated).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                    role: "superadmin",
                    department: "Executive",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()

        const { attributes, ...spreadUser } = userEntityWithAttributes
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(payload)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            ...payload,
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            role: "superadmin",
            department: "Executive",
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("updates user session with invalid user data", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api, jose } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const payload = {
            role: "superadmin",
            money: "100000",
        } as any

        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: payload,
            },
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(payload)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("updateSession with redirect: true and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api, jose } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)
        const payload = {
            name: "Alice",
        }

        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: { user: payload },
            redirectTo: "/dashboard",
            skipCSRFCheck: true,
        })
        expect(updated.headers.get("Location")).toBe("/dashboard")
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    name: "Alice",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: true,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(payload)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            ...payload,
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            sub: "user-123",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            ...payload,
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("updateSession with redirect: false and redirectTo", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api, jose } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)

        const payload = {
            name: "Alice",
        }
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: { user: payload },
            redirect: false,
            redirectTo: "/dashboard",
            skipCSRFCheck: true,
        })
        expect(updated).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    name: "Alice",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                },
                expires: expect.any(String),
            },
            success: true,
            redirect: false,
            redirectURL: "/dashboard",
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith(payload)
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            ...payload,
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            ...payload,
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("privilege escalation attempt is prevented when updating session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spyParse = vi.spyOn(registry, "parse")
        const spyParseAsPartial = vi.spyOn(registry, "parseAsPartial")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const touchSessionMock = vi.fn()
        const updateSessionMock = vi.fn()
        const revokeSessionMock = vi.fn()
        const updateUserMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api, jose } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
            updateUser: updateUserMock,
        })

        const csrfToken = await createCSRF(jose)

        const attackerExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: {
                    sub: "0987-alter-claims",
                    exp: attackerExpiration,
                    admin: true,
                } as any,
            },
        })

        expect(updated).toEqual({
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(updated.session).toMatchObject({
            user: {
                sub: "user-123",
                name: "John Doe",
                email: "john@example.com",
                image: "https://example.com/image.jpg",
            },
        })
        expect(updated.headers.get("Set-Cookie")).toBeNull()

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spyParse).toHaveBeenNthCalledWith(1, {
            sub: "user-123",
            ...spreadUser,
            ...attributes,
        })
        expect(spyParseAsPartial).toHaveBeenCalledWith({
            sub: "0987-alter-claims",
            exp: attackerExpiration,
            admin: true,
        })
        expect(spyParse).toHaveBeenNthCalledWith(2, {
            sub: "user-123",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            id: "session-123",
            userId: "user-123",
            deviceId: null,
            authenticatedWith: "credentials",
            status: "active",
            mfaState: "none",
            tokenHash: "hashed-token",
            expiresAt: expect.any(Date),
            metadata: null,
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })
})
