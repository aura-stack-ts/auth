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

import { signOut } from "@/lib/api"
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

describe("signOut", () => {
    test("returns API data when no redirectURL is in the response", async () => {
        const auth = makeAuth({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: null,
                headers: new Headers(),
            }),
        })

        const result = await signOut(auth)()

        expect(result).toMatchObject({ success: true })
        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("calls next redirect() with the redirectURL when sign-out succeeds and URL is returned", async () => {
        const auth = makeAuth({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: "/goodbye",
                headers: new Headers(),
            }),
        })

        await signOut(auth)()

        expect(mockRedirect).toHaveBeenCalledWith("/goodbye")
    })

    test("does NOT call redirect() when sign-out returns success: false", async () => {
        const auth = makeAuth({
            signOut: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: "/goodbye",
                headers: new Headers(),
            }),
        })

        await signOut(auth)()

        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("applies cookies from response headers on sign-out", async () => {
        const responseHeaders = new Headers()
        responseHeaders.append("Set-Cookie", "session=; Max-Age=0; Path=/")

        const auth = makeAuth({
            signOut: vi.fn().mockResolvedValue({
                success: true,
                redirectURL: null,
                headers: responseHeaders,
            }),
        })

        await signOut(auth)()

        expect(mockCookiesSet).toHaveBeenCalled()
    })
})
