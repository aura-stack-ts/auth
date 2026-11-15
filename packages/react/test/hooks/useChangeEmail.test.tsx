import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useChangeEmail } from "@/hooks/index.ts"

const redirectMock = vi.fn()
const payload = { currentPassword: "current-password", newEmail: "new@example.com" }

afterEach(() => {
    vi.clearAllMocks()
})

describe("useChangeEmail", () => {
    test("useChangeEmail outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useChangeEmail())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("changes the email without redirecting by default", async () => {
        const client = createMockClient()
        client.changeEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangeEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changeEmail({ payload })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.changeEmail).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.changeEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangeEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changeEmail({ payload, redirect: false, redirectTo: "/settings" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.changeEmail).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.changeEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/settings" })

        const { result } = renderHook(() => useChangeEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.changeEmail({ payload, redirect: true, redirectTo: "/settings" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/settings")
        expect(client.changeEmail).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/settings" })
    })

    test("tracks isPending while changing the email", async () => {
        const client = createMockClient()
        client.changeEmail = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useChangeEmail(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.changeEmail({ payload })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
