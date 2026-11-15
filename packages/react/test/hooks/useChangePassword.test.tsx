import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useChangePassword } from "@/hooks/index.ts"

const redirectMock = vi.fn()
const payload = { currentPassword: "old-password", newPassword: "new-password" }

afterEach(() => {
    vi.clearAllMocks()
})

describe("useChangePassword", () => {
    test("useChangePassword outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useChangePassword())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("changes the password without redirecting by default", async () => {
        const client = createMockClient()
        client.changePassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangePassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changePassword({ payload })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.changePassword).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.changePassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangePassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changePassword({ payload, redirect: false, redirectTo: "/settings" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.changePassword).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.changePassword = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangePassword(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changePassword({ payload, redirect: true, redirectTo: "/settings" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/settings")
        expect(client.changePassword).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("tracks isPending while changing the password", async () => {
        const client = createMockClient()
        client.changePassword = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useChangePassword(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.changePassword({ payload })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
