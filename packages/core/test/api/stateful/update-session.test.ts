import { describe, test, expect, vi } from "vitest"
import { z } from "zod/v4"
import { authInstance, jose } from "@test/setup/auth.ts"
import { createCSRF, createHash } from "@/exports/crypto.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { identitySchema as UserIdentity } from "@/identity/zod.ts"
import { sessionEntityWithUser, userEntity } from "@test/setup/entities.ts"
import { getCookie, getSetCookie } from "@/shared/http/cookie.ts"

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
            headers: {},
            session: {},
        })
        expect(updated).toEqual({
            session: null,
            headers: expect.any(Headers),
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            toResponse: expect.any(Function),
        })
        expect(spy).not.toHaveBeenCalled()
        expect(sessionByTokenMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
    })

    test("clears the session cookie when the session is invalid", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const getSessionByTokenMock = vi.fn().mockResolvedValue(null)
        const { api } = authInstance({ getSessionByToken: getSessionByTokenMock })

        const updated = await api.updateSession({
            headers: {
                Cookie: "aura-auth.session_token=invalid-session-token",
            },
            session: {},
        })

        expect(updated).toEqual({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "SESSION_NOT_FOUND",
                message: "The session token is not found. There is no active session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getSetCookie(updated.headers, "aura-auth.session_token")).toBe("")
    })

    test("preserves the session cookie when CSRF validation fails", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const getSessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const { api } = authInstance({ getSessionByToken: getSessionByTokenMock })
        const csrfToken = await createCSRF(jose)

        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-session-token; aura-auth.csrf_token=${csrfToken}`,
                "X-CSRF-Token": "invalid-csrf-token",
            }),
            session: {},
        })

        expect(updated).toEqual({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "UPDATE_SESSION_INVALID",
                message: "Failed to update session.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(getCookie(updated.headers, "aura-auth.session_token")).toContain("valid-session-token")
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
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
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

        const setCookies = updated.headers.getSetCookie()
        expect(setCookies).toHaveLength(2)
        expect(setCookies[0]).toBe("initial-provider-cookie=initial; Path=/")
        expect(setCookies[1]).toContain("aura-auth.session_token=")

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
            expiresAt: expect.any(Date),
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

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
            expiresAt: expect.any(Date),
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

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
            role: "superadmin",
            department: "Executive",
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            expiresAt: expect.any(Date),
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

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
            expiresAt: expect.any(Date),
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

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            expiresAt: expect.any(Date),
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

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
            ...payload,
        })
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            expiresAt: expect.any(Date),
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
        expect(updated.headers.get("Set-Cookie")).toContain("aura-auth.session_token=")

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
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
        expect(updateUserMock).toHaveBeenCalledWith("user-123", {})
        expect(updateSessionMock).toHaveBeenCalledWith("session-123", {
            expiresAt: expect.any(Date),
        })
        expect(touchSessionMock).toHaveBeenCalledWith("session-123", expect.any(Date))
    })

    test("arbitrary session lifetime extension is prevented when updating session", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api, jose } = authInstance(
            {
                getSessionByToken: sessionByTokenMock,
                updateSession: updateSessionMock,
                touchSession: touchSessionMock,
            },
            { identity: { skipValidation: true } }
        )

        const csrfToken = await createCSRF(jose)
        const attackerExpiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365 * 2
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                expires: new Date(attackerExpiration * 1000).toISOString(),
            },
        })

        expect(updated).toEqual({
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                },
                expires: expect.any(String),
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        const sessionExpiration = new Date(updated.session!.expires!).getTime()
        const persistedExpiration = updateSessionMock.mock.calls[0][1].expiresAt as Date
        const maximumExpiration = Date.now() + 60 * 60 * 24 * 15 * 1000 + 1000

        expect(sessionExpiration).not.toBe(attackerExpiration * 1000)
        expect(sessionExpiration).toBeLessThanOrEqual(maximumExpiration)
        expect(persistedExpiration.getTime()).toBe(sessionExpiration)
        expect(persistedExpiration.getTime()).toBeLessThanOrEqual(maximumExpiration)
    })

    test("improperly controlled user attributes are not persisted during session updates", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")

        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api, jose } = authInstance({
            getSessionByToken: sessionByTokenMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: new Headers({
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            }),
            session: {
                user: {
                    sub: "0987-alter-claims",
                    role: "admin",
                    cash: 10000,
                    emailVerified: true,
                } as any,
            },
        })

        expect(updated).toEqual({
            success: true,
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                },
                expires: expect.any(String),
            },
            redirect: false,
            redirectURL: null,
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(updateUserMock).not.toHaveBeenCalledWith(
            "user-123",
            expect.objectContaining({
                role: "admin",
                cash: 10000,
                emailVerified: true,
            })
        )
    })

    test("throws error when user is inactive", async () => {
        vi.stubEnv("BASE_URL", "http://localhost:3000")
        const getSessionByTokenMock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            user: { ...userEntity, status: "deleted" },
        })
        const updateUserMock = vi.fn()
        const updateSessionMock = vi.fn()
        const touchSessionMock = vi.fn()

        const { api } = authInstance({
            getSessionByToken: getSessionByTokenMock,
            updateUser: updateUserMock,
            updateSession: updateSessionMock,
            touchSession: touchSessionMock,
        })

        const csrfToken = await createCSRF(jose)
        const updated = await api.updateSession({
            headers: {
                Cookie: `aura-auth.session_token=valid-token-hash; aura-auth.csrf_token=${csrfToken}`,
            },
            session: {},
        })

        expect(updated).toEqual({
            session: null,
            success: false,
            redirect: false,
            redirectURL: null,
            error: {
                code: "ACCOUNT_INACTIVE",
                message: "This account is inactive. Please contact support.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(getSessionByTokenMock).toHaveBeenCalledWith(await createHash("valid-token-hash"))
        expect(updateUserMock).not.toHaveBeenCalled()
        expect(updateSessionMock).not.toHaveBeenCalled()
        expect(touchSessionMock).not.toHaveBeenCalled()
    })
})
