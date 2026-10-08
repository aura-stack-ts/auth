import { describe, expect, test, vi, beforeEach } from "vitest"

const { mockRedirect, mockHeaders, mockCookiesSet } = vi.hoisted(() => ({
    mockRedirect: vi.fn(),
    mockHeaders: vi.fn(),
    mockCookiesSet: vi.fn(),
}))

vi.mock("next/navigation", () => ({
    redirect: mockRedirect,
}))

vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: () =>
        Promise.resolve({
            set: mockCookiesSet,
        }),
}))

import { updateSession } from "@/lib/api"
import type { AuthInstance } from "@aura-stack/react"

const makeAuth = (apiOverrides: Partial<AuthInstance["api"]> = {}): AuthInstance => {
    return {
        api: {
            getSession: vi.fn().mockResolvedValue({ success: false }),
            signIn: vi.fn().mockResolvedValue({ success: false }),
            signInCredentials: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                headers: new Headers(),
            }),
            updateSession: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                redirectURL: null,
                headers: new Headers(),
            }),
            signOut: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                headers: new Headers(),
            }),
            ...apiOverrides,
        },
    } as unknown as AuthInstance
}

beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
})

describe("updateSession", () => {
    test("returns updated session data when no redirectTo is given", async () => {
        const session = { user: { sub: "u1", name: "Updated" }, expires: "2099-01-01" }
        const auth = makeAuth({
            updateSession: vi.fn().mockResolvedValue({
                success: true,
                session,
                redirectURL: null,
                headers: new Headers(),
            }),
        })

        const result = await updateSession(auth)({ session: { user: { name: "Updated" } } } as any)

        expect(result).toMatchObject({ success: true, session })
        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("calls next redirect() with redirectURL when redirectTo is set and update succeeds", async () => {
        const auth = makeAuth({
            updateSession: vi.fn().mockResolvedValue({
                success: true,
                session: {},
                redirectURL: "/profile",
                headers: new Headers(),
            }),
        })

        await updateSession(auth)({
            session: { user: { name: "Alice" } },
            redirectTo: "/profile",
        } as any)

        expect(mockRedirect).toHaveBeenCalledWith("/profile")
    })

    test("does NOT call redirect() when update fails", async () => {
        const auth = makeAuth({
            updateSession: vi.fn().mockResolvedValue({
                success: false,
                session: null,
                redirectURL: "/profile",
                headers: new Headers(),
            }),
        })

        await updateSession(auth)({
            session: { user: { name: "Bob" } },
            redirectTo: "/profile",
        } as any)

        expect(mockRedirect).not.toHaveBeenCalled()
    })
})
