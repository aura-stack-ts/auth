import { beforeEach, describe, expect, test, vi } from "vitest"

const { mockHeaders } = vi.hoisted(() => ({
    mockHeaders: vi.fn(),
}))

vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: vi.fn(),
}))

import { getAccessToken } from "@/lib/api"
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

describe("getAccessToken", () => {
    test("forwards headers and options to the API", async () => {
        const headers = new Headers({ "x-request-id": "req-1" })
        mockHeaders.mockResolvedValue(headers)

        const apiGetAccessToken = vi.fn().mockResolvedValue({ success: true, accessToken: "token" })
        const auth = makeAuth({ getAccessToken: apiGetAccessToken })

        const result = await getAccessToken(auth)("github", { cache: "no-store" } as any)

        expect(result).toEqual({ success: true, accessToken: "token" })
        expect(apiGetAccessToken).toHaveBeenCalledWith("github", {
            headers,
            cache: "no-store",
        })
    })

    test("returns failure responses as-is", async () => {
        const auth = makeAuth({
            getAccessToken: vi.fn().mockResolvedValue({ success: false, accessToken: null }),
        })

        await expect(getAccessToken(auth)("github")).resolves.toEqual({
            success: false,
            accessToken: null,
        })
    })
})
