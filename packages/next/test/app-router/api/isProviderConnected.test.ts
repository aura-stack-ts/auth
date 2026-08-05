import { beforeEach, describe, expect, test, vi } from "vitest"

const { mockHeaders } = vi.hoisted(() => ({
    mockHeaders: vi.fn(),
}))

vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: vi.fn(),
}))

import { isProviderConnected } from "@/lib/api"
import type { AuthInstance } from "@aura-stack/react"

const makeAuth = (apiOverrides: Partial<AuthInstance["api"]> = {}): AuthInstance => {
    return {
        api: {
            getSession: vi.fn().mockResolvedValue({ success: false }),
            signIn: vi.fn().mockResolvedValue({ success: false }),
            signInCredentials: vi.fn().mockResolvedValue({ success: false, redirectURL: null, headers: new Headers() }),
            updateSession: vi
                .fn()
                .mockResolvedValue({ success: false, session: null, redirectURL: null, headers: new Headers() }),
            getProviderTokens: vi.fn().mockResolvedValue({ success: false }),
            getAccessToken: vi.fn().mockResolvedValue({ success: false }),
            signOut: vi.fn().mockResolvedValue({ success: false, redirectURL: null, headers: new Headers() }),
            signUp: vi.fn().mockResolvedValue({ success: false, redirectURL: null, headers: new Headers() }),
            refreshUserInfo: vi.fn().mockResolvedValue({ success: false, headers: new Headers() }),
            revokeToken: vi.fn().mockResolvedValue({ success: false, headers: new Headers() }),
            disconnectProvider: vi.fn().mockResolvedValue({ success: false, headers: new Headers() }),
            isProviderConnected: vi.fn().mockResolvedValue({ success: false, connected: false }),
            ...apiOverrides,
        },
    } as unknown as AuthInstance
}

beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
})

describe("isProviderConnected", () => {
    test("forwards headers and returns a connected response", async () => {
        const headers = new Headers({ "x-request-id": "req-1" })
        mockHeaders.mockResolvedValue(headers)

        const apiIsProviderConnected = vi.fn().mockResolvedValue({ success: true, connected: true })
        const auth = makeAuth({ isProviderConnected: apiIsProviderConnected })

        const result = await isProviderConnected(auth)("github", { cache: "no-store" } as any)

        expect(result).toEqual({ success: true, connected: true })
        expect(apiIsProviderConnected).toHaveBeenCalledWith("github", {
            headers,
            cache: "no-store",
        })
    })

    test("returns false when the API reports no connection", async () => {
        const auth = makeAuth({
            isProviderConnected: vi.fn().mockResolvedValue({ success: true, connected: false }),
        })

        await expect(isProviderConnected(auth)("github")).resolves.toEqual({
            success: true,
            connected: false,
        })
    })
})
