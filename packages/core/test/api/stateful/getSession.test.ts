import { describe, test, expect, vi } from "vitest"
import { getSetCookie } from "@/cookie.ts"
import { authInstance, sessionEntityWithUser, userEntity } from "@test/presets.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

describe("getSession", () => {
    test("getSession with no session token", async () => {
        const { api } = authInstance({})
        const session = await api.getSession({ headers: new Headers() })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
    })

    test("getSession with invalid session token", async () => {
        const { api } = authInstance({})

        const session = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=invalidtoken` },
        })
        expect(session).toMatchObject({
            session: null,
            headers: {},
            success: false,
        })
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
        const output = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=valid-token-hash` },
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

        expect(mock).toHaveBeenCalledWith("valid-token-hash")
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({ sub: userEntity.id, ...spreadPayload })
        expect(getSetCookie(output.headers, "aura-auth.session_token")).toBe("valid-token-hash")
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
            headers: { Cookie: `aura-auth.session_token=valid-token-hash` },
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

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
        expect(spy).not.toHaveBeenCalled()
        expect(getSetCookie(output.headers, "aura-auth.csrf_token")).toBe("")
        expect(getSetCookie(output.headers, "aura-auth.session_token")).toBe("")
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
            headers: { Cookie: `aura-auth.session_token=valid-token-hash` },
        })

        expect(output).toMatchObject({
            session: null,
            success: false,
            error: {
                code: "GET_SESSION_FAILED",
                message: "Failed to retrieve session. The session token may be missing, expired, or invalid.",
            },
            headers: expect.any(Headers),
            toResponse: expect.any(Function),
        })

        expect(mock).toHaveBeenCalledWith("valid-token-hash")
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({
            ...spreadPayload,
            id: undefined,
            sub: undefined,
            name: undefined,
        })
        expect(getSetCookie(output.headers, "aura-auth.csrf_token")).toBe("")
        expect(getSetCookie(output.headers, "aura-auth.session_token")).toBe("")
    })

    test("getSession with extra claims in session token", async () => {
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
        const output = await api.getSession({
            headers: { Cookie: `aura-auth.session_token=valid-token-hash` },
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

        expect(mock).toHaveBeenCalledWith("valid-token-hash")
        const { attributes: _, ...spreadPayload } = userEntity
        expect(spy).toHaveBeenCalledWith({
            ...spreadPayload,
            sub: userEntity.id,
            role: "admin",
            permissions: ["read", "write"],
        })
        expect(getSetCookie(output.headers, "aura-auth.session_token")).toBe("valid-token-hash")
    })
})
