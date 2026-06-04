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

import { signInCredentials } from "@/lib/api"
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

describe("signInCredentials", () => {
    const payload = { username: "alice", password: "secret" }

    test("returns API data when no redirectTo is supplied", async () => {
        const apiData = {
            success: true,
            redirectURL: "/",
            headers: new Headers(),
        }
        const auth = makeAuth({ signInCredentials: vi.fn().mockResolvedValue(apiData) })

        await signInCredentials(auth)({ payload } as any)
        expect(mockRedirect).toHaveBeenCalled()
    })

    test("calls next redirect() with redirectURL when redirectTo is set and sign-in succeeds", async () => {
        const auth = makeAuth({
            signInCredentials: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: "/dashboard",
                headers: new Headers(),
            }),
        })

        await signInCredentials(auth)({ payload, redirectTo: "/dashboard" } as any)

        expect(mockRedirect).toHaveBeenCalledWith("/dashboard")
    })

    test("does NOT call redirect() when sign-in fails", async () => {
        const auth = makeAuth({
            signInCredentials: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: "/",
                headers: new Headers(),
            }),
        })

        await signInCredentials(auth)({ payload, redirectTo: "/dashboard" } as any)

        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("applies cookies from response headers", async () => {
        const responseHeaders = new Headers()
        // Headers.append is needed for Set-Cookie simulation
        responseHeaders.append("Set-Cookie", "session=abc; Path=/; HttpOnly")

        const auth = makeAuth({
            signInCredentials: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: null,
                headers: responseHeaders,
            }),
        })

        await signInCredentials(auth)({ payload } as any)

        expect(mockCookiesSet).toHaveBeenCalled()
    })
})
