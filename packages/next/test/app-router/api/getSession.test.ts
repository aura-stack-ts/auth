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

import { getSession } from "@/lib/api"
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

describe("getSession", () => {
    test("returns null when the API reports success: false", async () => {
        const auth = makeAuth({
            getSession: vi.fn().mockResolvedValue({ success: false }),
        })

        const result = await getSession(auth)()
        expect(result).toBeNull()
    })

    test("returns null when the API throws", async () => {
        const auth = makeAuth({
            getSession: vi.fn().mockRejectedValue(new Error("network error")),
        })

        const result = await getSession(auth)()
        expect(result).toBeNull()
    })

    test("returns the session object when the API reports success: true", async () => {
        const session = { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" }
        const auth = makeAuth({
            getSession: vi.fn().mockResolvedValue({ success: true, session }),
        })

        const result = await getSession(auth)()
        expect(result).toEqual(session)
    })

    test("calls getSession with headers from next/headers", async () => {
        const apiGetSession = vi.fn().mockResolvedValue({ success: true, session: null })
        const auth = makeAuth({ getSession: apiGetSession })
        const dummyHeaders = new Headers({ "x-test": "val" })
        mockHeaders.mockResolvedValue(dummyHeaders)

        await getSession(auth)()

        expect(apiGetSession).toHaveBeenCalledWith({ headers: dummyHeaders })
    })
})
