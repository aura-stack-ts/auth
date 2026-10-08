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

import { getProviderTokens } from "@/lib/api"
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

describe("getProviderTokens", () => {
    test("returns success: false when the API reports failure", async () => {
        const auth = makeAuth({
            getProviderTokens: vi.fn().mockResolvedValue({ success: false }),
        })

        const output = await getProviderTokens(auth)("github")
        expect(output).toEqual({ success: false })
    })

    test("returns success: true and tokens when the API reports success", async () => {
        const auth = makeAuth({
            getProviderTokens: vi.fn().mockResolvedValue({
                success: true,
                tokens: { accessToken: "abc123", refreshToken: "def456" },
            }),
        })

        const output = await getProviderTokens(auth)("github")
        expect(output).toEqual({
            success: true,
            tokens: { accessToken: "abc123", refreshToken: "def456" },
        })
    })

    test("calls getProviderTokens with headers from next/headers", async () => {
        const mock = vi.fn().mockResolvedValue({
            success: true,
            tokens: {
                accessToken: "abc123",
                refreshToken: "def456",
            },
        })
        const auth = makeAuth({
            getProviderTokens: mock,
        })
        const headers = new Headers({ "x-custom-header": "value" })
        mockHeaders.mockResolvedValue(headers)

        await getProviderTokens(auth)("github")
        expect(mock).toHaveBeenCalledWith("github", { headers })
    })
})
