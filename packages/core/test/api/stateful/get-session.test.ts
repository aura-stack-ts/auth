import { describe, test, expect, vi } from "vitest"
import { createHash } from "@/exports/crypto.ts"
import { authInstance } from "@test/setup/auth.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { sessionEntityWithUser, userEntity } from "@test/setup/entities.ts"

describe("getSession", () => {
    test("getSession with no session token", async () => {
        const { api } = authInstance({})
        const output = await api.getSession({ headers: {} })
        expect(output).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with invalid session token", async () => {
        const { api } = authInstance({})

        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=invalidtoken` },
        })
        expect(output).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])
    })

    test("getSession with valid session token", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const mock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { api } = authInstance({
            getSessionByToken: mock,
        })
        const sessionToken = "valid-token"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.getSession({
            headers: {
                Cookie: `__Secure-aura-auth.session_token=${sessionToken}`,
                "Set-Cookie": "initial-provider-cookie=initial; Path=/",
            },
        })

        expect(output).toEqual({
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: sessionToken,
                sameSite: "lax",
            }),
        ])

        expect(mock).toHaveBeenCalledWith(sessionTokenHash)
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({ sub: userEntity.id, ...spreadPayload })
    })

    test("getSession with expired session token", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const sessionByTokenMock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            expiresAt: new Date(Date.now() - 1000),
        })
        const revokeSessionMock = vi.fn().mockResolvedValue(true)

        const { api } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
        })
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=valid-token-hash` },
        })
        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        const tokenHash = await createHash("valid-token-hash")
        expect(sessionByTokenMock).toHaveBeenCalledWith(tokenHash)
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
        expect(spy).not.toHaveBeenCalled()
    })

    test("getSession with session token missing sub claim", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const mock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            user: {
                ...userEntity,
                id: undefined,
                name: undefined,
            },
        })

        const { api } = authInstance({
            getSessionByToken: mock,
        })
        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=valid-token-hash` },
        })

        expect(output).toEqual({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "",
                expires: new Date(0),
            }),
        ])

        const tokenHash = await createHash("valid-token-hash")
        expect(mock).toHaveBeenCalledWith(tokenHash)
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({
            ...spreadPayload,
            id: undefined,
            sub: undefined,
            name: undefined,
        })
    })

    test("getSession with extra attributes in database", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const mock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            user: {
                ...userEntity,
                attributes: {
                    role: "admin",
                    permissions: ["read", "write"],
                },
            },
        })

        const { api } = authInstance({
            getSessionByToken: mock,
        })
        const sessionToken = "valid-token"
        const sessionTokenHash = await createHash(sessionToken)

        const output = await api.getSession({
            headers: { Cookie: `__Secure-aura-auth.session_token=${sessionToken}` },
        })

        expect(output).toEqual({
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
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })
        expect(output.headers).toHaveValidSecurityHeaders()
        expect(output.headers).toHaveValidSetCookies([
            expect.objectContaining({
                name: "__Secure-aura-auth.session_token",
                value: "valid-token",
                sameSite: "lax",
            }),
        ])

        expect(mock).toHaveBeenCalledWith(sessionTokenHash)
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({
            ...spreadPayload,
            sub: userEntity.id,
            role: "admin",
            permissions: ["read", "write"],
        })
    })
})
