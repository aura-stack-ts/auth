import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { createSchemaRegistry } from "@/validator/registry.ts"
import { authInstance, sessionPayload, userPayload } from "@test/session/stateful/stateful-presets.ts"
import { getCookie } from "@/cookie.ts"

describe("getSession", () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-03-24T00:00:00Z"))
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.resetAllMocks()
        vi.clearAllMocks()
    })

    test("should return session when valid token exists", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const mock = vi.fn().mockResolvedValue(sessionPayload)
        const { GET } = authInstance({
            getSessionByToken: mock,
        })
        const response = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "__Secure-aura-auth.session_token=valid-token",
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: {
                user: {
                    sub: "user-123",
                    name: "John Doe",
                    email: "john@example.com",
                    image: "https://example.com/image.jpg",
                },
                expires: sessionPayload.expiresAt.toISOString(),
            },
            success: true,
        })
        expect(mock).toHaveBeenCalledWith("valid-token")
        expect(spy).toHaveBeenCalledWith({ sub: userPayload.id, ...userPayload, ...userPayload.attributes })
        expect(getCookie(response.headers, "__Secure-aura-auth.session_token")).toBeDefined()
    })

    test("should return null session when token not found", async () => {
        const mock = vi.fn().mockResolvedValue(null)
        const { GET } = authInstance({
            getSessionByToken: mock,
        })
        const response = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "__Secure-aura-auth.session_token=invalid-token",
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            session: null,
            success: false,
        })
        expect(mock).toHaveBeenCalledWith("invalid-token")
    })

    test("should return null session when session has no user", async () => {
        const mock = vi.fn().mockResolvedValue({
            ...sessionPayload,
            user: null as any,
        })
        const { GET } = authInstance({
            getSessionByToken: mock,
        })
        const response = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "__Secure-aura-auth.session_token=token-without-user",
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            session: null,
            success: false,
        })
        expect(mock).toHaveBeenCalledWith("token-without-user")
    })

    test("should return null session on adapter error", async () => {
        const mock = vi.fn().mockRejectedValue(new Error("DB Error"))
        const { GET } = authInstance({
            getSessionByToken: mock,
        })
        const response = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "__Secure-aura-auth.session_token=error-token",
                },
            })
        )
        expect(response.status).toBe(401)
        expect(await response.json()).toEqual({
            session: null,
            success: false,
        })
        expect(mock).toHaveBeenCalledWith("error-token")
    })

    test("should skip validation when identity.skipValidation is true", async () => {
        const registry = createSchemaRegistry({})
        const module = await import("@/validator/registry.ts")

        const spy = vi.spyOn(registry, "parse")
        vi.spyOn(module, "createSchemaRegistry").mockReturnValue(registry)

        const mock = vi.fn().mockResolvedValue(sessionPayload)
        const { GET } = authInstance(
            {
                getSessionByToken: mock,
            },
            { skipValidation: true }
        )
        const response = await GET(
            new Request("https://example.com/auth/session", {
                headers: {
                    Cookie: "__Secure-aura-auth.session_token=valid-token",
                },
            })
        )
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            session: {
                user: {
                    ...userPayload,
                    sub: "user-123",
                    createdAt: userPayload.createdAt.toISOString(),
                    updatedAt: userPayload.updatedAt.toISOString(),
                    emailVerifiedAt: userPayload.emailVerifiedAt?.toISOString(),
                },
                expires: sessionPayload.expiresAt.toISOString(),
            },
            success: true,
        })
        expect(mock).toHaveBeenCalledWith("valid-token")
        expect(spy).not.toHaveBeenCalled()
    })
})
