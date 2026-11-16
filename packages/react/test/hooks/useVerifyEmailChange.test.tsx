import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useVerifyEmailChange } from "@/hooks.ts"

const redirectMock = vi.fn()
const payload = { token: "email-change-token" }

afterEach(() => {
    vi.clearAllMocks()
})

describe("useVerifyEmailChange", () => {
    test("useVerifyEmailChange outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useVerifyEmailChange())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("verifies the email change without redirecting by default", async () => {
        const client = createMockClient()
        client.verifyEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: "/email-updated" })

        const { result } = renderHook(() => useVerifyEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmailChange({ payload })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyEmailChange).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.verifyEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: "/email-updated" })

        const { result } = renderHook(() => useVerifyEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmailChange({ payload, redirect: false, redirectTo: "/email-updated" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyEmailChange).toHaveBeenCalledWith({
            payload,
            redirect: false,
            redirectTo: "/email-updated",
        })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.verifyEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: "/email-updated" })

        const { result } = renderHook(() => useVerifyEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmailChange({ payload, redirect: true, redirectTo: "/email-updated" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/email-updated")
        expect(client.verifyEmailChange).toHaveBeenCalledWith({
            payload,
            redirect: false,
            redirectTo: "/email-updated",
        })
    })

    test("tracks isPending while verifying an email change", async () => {
        const client = createMockClient()
        client.verifyEmailChange = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useVerifyEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.verifyEmailChange({ payload })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
