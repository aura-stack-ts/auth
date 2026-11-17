import { beforeEach, describe, expect, test, vi } from "vitest"

const { mockRedirect, mockHeaders, mockCookiesSet, mockParseSetCookie } = vi.hoisted(() => ({
    mockRedirect: vi.fn((url: string) => `redirect:${url}`),
    mockHeaders: vi.fn(),
    mockCookiesSet: vi.fn(),
    mockParseSetCookie: vi.fn(() => ({ name: "session_token", value: "session-value" })),
}))

vi.mock("next/navigation", () => ({ redirect: mockRedirect }))
vi.mock("next/headers", () => ({
    headers: mockHeaders,
    cookies: () => Promise.resolve({ set: mockCookiesSet }),
}))
vi.mock("@aura-stack/react/cookies", () => ({ parseSetCookie: mockParseSetCookie }))

import { changePassword } from "@/lib/api"
import { makeAuth, responseHeaders } from "@test/app-router/api/actionTestUtils"

beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
})

describe("changePassword", () => {
    test("forwards the payload and headers, syncs cookies, and redirects on success", async () => {
        const payload = { currentPassword: "old-password", newPassword: "new-password" }
        const apiAction = vi.fn().mockResolvedValue({ success: true, redirectURL: "/complete", headers: responseHeaders() })
        const auth = makeAuth({ changePassword: apiAction })

        const result = await changePassword(auth)({ payload, redirectTo: "/complete" })

        expect(apiAction).toHaveBeenCalledWith({
            payload,
            headers: expect.any(Headers),
            redirectTo: "/complete",
            redirect: false,
        })
        expect(mockCookiesSet).toHaveBeenCalledWith("session_token", "session-value", {})
        expect(mockRedirect).toHaveBeenCalledWith("/complete")
        expect(result).toBe("redirect:/complete")
    })
})
