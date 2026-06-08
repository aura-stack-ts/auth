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

import { signIn } from "@/lib/api"
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

describe("signIn", () => {
    test("returns the API data when redirect option is false", async () => {
        const apiData = { success: true, signInURL: "https://oauth.example.com" }
        const auth = makeAuth({ signIn: vi.fn().mockResolvedValue(apiData) })

        const result = await signIn(auth)("github", { redirect: false } as any)

        expect(result).toMatchObject(apiData)
        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("calls next redirect() with signInURL when redirectTo is provided and sign-in succeeds", async () => {
        const auth = makeAuth({
            signIn: vi.fn().mockResolvedValue({
                success: true,
                signInURL: "https://oauth.example.com/callback",
            }),
        })

        await signIn(auth)("github", { redirectTo: "/dashboard" } as any)

        expect(mockRedirect).toHaveBeenCalledWith("https://oauth.example.com/callback")
    })

    test("does NOT call redirect() when sign-in fails even if redirectTo is set", async () => {
        const auth = makeAuth({
            signIn: vi.fn().mockResolvedValue({
                success: false,
                signInURL: "https://oauth.example.com/callback",
            }),
        })

        await signIn(auth)("github", { redirectTo: "/dashboard" } as any)

        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("does NOT call redirect() when redirectTo is absent", async () => {
        const auth = makeAuth({
            signIn: vi.fn().mockResolvedValue({ success: true, signInURL: "https://oauth.example.com" }),
        })

        await signIn(auth)("github")

        expect(mockRedirect).toHaveBeenCalled()
    })

    test("always forces redirect: false on the internal api.signIn call", async () => {
        const apiSignIn = vi.fn().mockResolvedValue({ success: false })
        const auth = makeAuth({ signIn: apiSignIn })

        await signIn(auth)("github", { redirectTo: "/home" } as any)

        expect(apiSignIn).toHaveBeenCalledWith("github", expect.objectContaining({ redirect: false }))
    })
})
