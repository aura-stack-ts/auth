import { beforeEach, describe, expect, test, vi } from "vitest"

const { mockRedirect, mockHeaders, mockCookiesSet, mockParseSetCookie } = vi.hoisted(() => ({
    mockRedirect: vi.fn((url: string) => `redirect:${url}`),
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
            else if (lower.startsWith("samesite=")) options.sameSite = part.slice(9).toLowerCase()
        }

        return { name, value, ...options }
    }),
}))

vi.mock("next/navigation", () => ({
    redirect: mockRedirect,
}))

vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: () => Promise.resolve({ set: mockCookiesSet }),
}))

vi.mock("@aura-stack/react/cookies", () => ({
    parseSetCookie: mockParseSetCookie,
}))

import { signUp } from "@/lib/api"
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

describe("signUp", () => {
    test("redirects and syncs cookies when sign-up succeeds with redirectURL", async () => {
        const responseHeaders = makeResponseHeaders(
            "session_token=abc123; Path=/; HttpOnly; Secure",
            "state=xyz; Path=/; HttpOnly"
        )
        const apiSignUp = vi.fn().mockResolvedValue({
            success: true,
            redirectURL: "/welcome",
            headers: responseHeaders,
        })
        const auth = makeAuth({ signUp: apiSignUp })

        const result = await signUp(auth)({
            payload: {
                name: "Jane",
                email: "jane@example.com",
                password: "secret",
            },
        } as any)

        expect(result).toBe("redirect:/welcome")
        expect(apiSignUp).toHaveBeenCalledWith({
            headers: expect.any(Headers),
            payload: {
                name: "Jane",
                email: "jane@example.com",
                password: "secret",
            },
            redirect: false,
        })
        expect(mockCookiesSet).toHaveBeenCalledWith(
            "session_token",
            "abc123",
            expect.objectContaining({ path: "/", httpOnly: true, secure: true })
        )
        expect(mockCookiesSet).toHaveBeenCalledWith("state", "xyz", expect.objectContaining({ path: "/", httpOnly: true }))
        expect(mockRedirect).toHaveBeenCalledWith("/welcome")
    })

    test("returns the API response when sign-up succeeds without redirectURL", async () => {
        const apiSignUp = vi.fn().mockResolvedValue({
            success: true,
            redirectURL: null,
            headers: makeResponseHeaders(),
        })
        const auth = makeAuth({ signUp: apiSignUp })

        await expect(
            signUp(auth)({
                payload: {
                    name: "Jane",
                    email: "jane@example.com",
                    password: "secret",
                },
            } as any)
        ).resolves.toEqual({
            success: true,
            redirectURL: null,
            headers: expect.any(Object),
        })
        expect(mockRedirect).not.toHaveBeenCalled()
    })

    test("does not redirect when sign-up fails even if redirectURL exists", async () => {
        const apiSignUp = vi.fn().mockResolvedValue({
            success: false,
            redirectURL: "/welcome",
            headers: makeResponseHeaders(),
        })
        const auth = makeAuth({ signUp: apiSignUp })

        await signUp(auth)({
            payload: {
                name: "Jane",
                email: "jane@example.com",
                password: "secret",
            },
        } as any)

        expect(mockRedirect).not.toHaveBeenCalled()
    })
})
