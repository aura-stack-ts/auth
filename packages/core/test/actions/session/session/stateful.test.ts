import { describe, test, expect, vi } from "vitest"
import { authInstance, jose, sessionEntityWithUser, sessionPayload, userEntity } from "@test/presets.ts"
import { createSchemaRegistry } from "@/validator/registry.ts"

describe("sessionAction", () => {
    const { encodeJWT } = jose

    test("sessionToken cookie not found", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            getSessionByToken: sessionByTokenMock,
            revokeSession: revokeSessionMock,
        })
        const request = await handlers.GET(new Request("https://example.com/auth/session"))
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ success: false, session: null })

        expect(spy).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(sessionByTokenMock).not.toHaveBeenCalled()
    })

    test("invalid sessionToken cookie", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })

        const request = await handlers.GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "aura-auth.session_token=invalidtoken",
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ success: false, session: null })

        expect(spy).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(sessionByTokenMock).not.toHaveBeenCalled()
    })

    test("valid sessionToken cookie with correct version", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })

        const request = await handlers.GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(request.status).toBe(200)
        expect(await request.json()).toEqual({
            success: true,
            session: {
                user: {
                    ...sessionPayload,
                    sub: "user-123",
                },
                expires: expect.any(String),
            },
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(sessionByTokenMock).toHaveReturnedWith(Promise.resolve(sessionEntityWithUser))
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spy).toHaveBeenCalledWith({ ...spreadUser, ...attributes, sub: userEntity.id })
    })

    test("valid sessionToken cookie in insecure connection", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })

        const request = await handlers.GET(
            new Request("http://example.com/auth/session", {
                headers: {
                    Cookie: `aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(request.status).toBe(200)
        expect(await request.json()).toMatchObject({
            success: true,
            session: {
                user: {
                    ...sessionPayload,
                    sub: "user-123",
                },
                expires: expect.any(String),
            },
        })

        expect(sessionByTokenMock).toHaveBeenCalledWith("valid-token-hash")
        expect(sessionByTokenMock).toHaveReturnedWith(Promise.resolve(sessionEntityWithUser))
        expect(revokeSessionMock).not.toHaveBeenCalled()
        const { attributes, ...spreadUser } = userEntity
        expect(spy).toHaveBeenCalledWith({ ...spreadUser, ...attributes, sub: userEntity.id })
    })

    test("expired sessionToken cookie", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue({
            ...sessionEntityWithUser,
            expiresAt: new Date(Date.now() / 1000 - 3600),
        })

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })
        const request = await handlers.GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=expired-token-hash`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ success: false, session: null })

        expect(sessionByTokenMock).toHaveBeenCalledWith("expired-token-hash")
        expect(revokeSessionMock).toHaveBeenCalledWith("session-123", "user_logout")
        expect(spy).not.toHaveBeenCalled()
    })

    test("verify cache control headers are set", async () => {
        const { handlers } = authInstance({})
        const request = await handlers.GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        const headers = request.headers
        expect(headers.get("Cache-Control")).toBe("no-store")
        expect(headers.get("Pragma")).toBe("no-cache")
        expect(headers.get("Expires")).toBe("0")
        expect(headers.get("Vary")).toBe("Cookie")
    })

    test("invalid access from http", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })

        const request = await handlers.GET(
            new Request("http://example.com/auth/session", {
                headers: {
                    Cookie: `__Secure-aura-auth.session_token=valid-token-hash`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ success: false, session: null })

        expect(sessionByTokenMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(spy).not.toHaveBeenCalled()
    })

    test("invalid access from https", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const revokeSessionMock = vi.fn()
        const sessionByTokenMock = vi.fn().mockResolvedValue(sessionEntityWithUser)

        const { handlers } = authInstance({
            revokeSession: revokeSessionMock,
            getSessionByToken: sessionByTokenMock,
        })
        const sessionToken = await encodeJWT(sessionPayload)
        const request = await handlers.GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: `aura-auth.session_token=${sessionToken}`,
                },
            })
        )
        expect(request.status).toBe(401)
        expect(await request.json()).toEqual({ success: false, session: null })

        expect(sessionByTokenMock).not.toHaveBeenCalled()
        expect(revokeSessionMock).not.toHaveBeenCalled()
        expect(spy).not.toHaveBeenCalled()
    })
})
