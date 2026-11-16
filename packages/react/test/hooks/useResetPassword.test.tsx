import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useResetPassword } from "@/hooks.ts"

const redirectMock = vi.fn()
const payload = { token: "reset-token", newPassword: "new-password" }

afterEach(() => {
    vi.clearAllMocks()
})

describe("useResetPassword", () => {
    test("useResetPassword outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useResetPassword())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("resets the password without redirecting by default", async () => {
        const client = createMockClient()
        client.resetPassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/sign-in" })

        const { result } = renderHook(() => useResetPassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.resetPassword({ payload })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.resetPassword).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.resetPassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/sign-in" })

        const { result } = renderHook(() => useResetPassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.resetPassword({ payload, redirect: false, redirectTo: "/sign-in" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.resetPassword).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/sign-in" })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.resetPassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/sign-in" })

        const { result } = renderHook(() => useResetPassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.resetPassword({ payload, redirect: true, redirectTo: "/sign-in" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/sign-in")
        expect(client.resetPassword).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/sign-in" })
    })

    test("tracks isPending while resetting the password", async () => {
        const client = createMockClient()
        client.resetPassword = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useResetPassword(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.resetPassword({ payload })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
