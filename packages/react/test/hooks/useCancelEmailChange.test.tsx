import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useCancelEmailChange } from "@/hooks.ts"

const redirectMock = vi.fn()
const payload = { token: "email-change-cancel-token" }

afterEach(() => {
    vi.clearAllMocks()
})

describe("useCancelEmailChange", () => {
    test("useCancelEmailChange outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useCancelEmailChange())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("cancels the email change without redirecting by default", async () => {
        const client = createMockClient()
        client.cancelEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: null })

        const { result } = renderHook(() => useCancelEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.cancelEmailChange()
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.cancelEmailChange).toHaveBeenCalledWith({ redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.cancelEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useCancelEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.cancelEmailChange({ payload, redirect: false, redirectTo: "/settings" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.cancelEmailChange).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.cancelEmailChange = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useCancelEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.cancelEmailChange({ payload, redirect: true, redirectTo: "/settings" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/settings")
        expect(client.cancelEmailChange).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("tracks isPending while cancelling the email change", async () => {
        const client = createMockClient()
        client.cancelEmailChange = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useCancelEmailChange(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.cancelEmailChange()

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
