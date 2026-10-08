import { beforeEach, describe, expect, test, vi } from "vitest"

const { mockHeaders, mockCookiesSet, mockParseSetCookie } = vi.hoisted(() => ({
    mockHeaders: vi.fn(),
    mockCookiesSet: vi.fn(),
    mockParseSetCookie: vi.fn((cookieStr: string) => {
        const [nameValue, ...parts] = cookieStr.split("; ").map((part) => part.trim())
        const [name, ...valueParts] = nameValue.split("=")
        const value = valueParts.join("=")
        const options: Record<string, unknown> = {}

        for (const part of parts) {
            const lower = part.toLowerCase()
            if (lower === "httponly") options.httpOnly = true
            else if (lower === "secure") options.secure = true
            else if (lower.startsWith("path=")) options.path = part.slice(5)
        }

        return { name, value, ...options }
    }),
}))

vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: () => Promise.resolve({ set: mockCookiesSet }),
}))

vi.mock("@aura-stack/react/cookies", () => ({
    parseSetCookie: mockParseSetCookie,
}))

import { refreshUserInfo } from "@/lib/api"
import type { AuthInstance } from "@aura-stack/react"

const makeResponseHeaders = (...setCookies: string[]) =>
    ({
        getSetCookie: () => setCookies,
    }) as unknown as Headers

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

describe("refreshUserInfo", () => {
    test("forwards headers, returns response, and syncs cookies", async () => {
        const headers = new Headers({ "x-test": "value" })
        mockHeaders.mockResolvedValue(headers)

        const responseHeaders = makeResponseHeaders("profile=updated; Path=/; HttpOnly")
        const apiRefreshUserInfo = vi.fn().mockResolvedValue({
            success: true,
            headers: responseHeaders,
            user: { name: "Jane" },
        })
        const auth = makeAuth({ refreshUserInfo: apiRefreshUserInfo })

        const result = await refreshUserInfo(auth)("github", { cache: "no-store" } as any)

        expect(result).toEqual({
            success: true,
            headers: responseHeaders,
            user: { name: "Jane" },
        })
        expect(apiRefreshUserInfo).toHaveBeenCalledWith("github", {
            headers,
            cache: "no-store",
        })
        expect(mockCookiesSet).toHaveBeenCalledWith("profile", "updated", expect.objectContaining({ path: "/", httpOnly: true }))
    })

    test("returns failure responses without writing cookies", async () => {
        const apiRefreshUserInfo = vi.fn().mockResolvedValue({
            success: false,
            headers: makeResponseHeaders(),
        })
        const auth = makeAuth({ refreshUserInfo: apiRefreshUserInfo })

        await expect(refreshUserInfo(auth)("github")).resolves.toEqual({
            success: false,
            headers: expect.any(Object),
        })
        expect(mockCookiesSet).not.toHaveBeenCalled()
    })
})
