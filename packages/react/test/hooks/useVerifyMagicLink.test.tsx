import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useVerifyMagicLink } from "@/hooks.ts"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
})

describe("useVerifyMagicLink", () => {
    test("useVerifyMagicLink outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useVerifyMagicLink())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("verifies the token without redirecting by default", async () => {
        const client = createMockClient()
        client.verifyMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/dashboard" })

        const { result } = renderHook(() => useVerifyMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyMagicLink("magic-link-token")
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyMagicLink).toHaveBeenCalledWith("magic-link-token", { redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.verifyMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/dashboard" })

        const { result } = renderHook(() => useVerifyMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyMagicLink("magic-link-token", { redirect: false, redirectTo: "/dashboard" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyMagicLink).toHaveBeenCalledWith("magic-link-token", {
            redirect: false,
            redirectTo: "/dashboard",
        })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.verifyMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/dashboard" })

        const { result } = renderHook(() => useVerifyMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyMagicLink("magic-link-token", { redirect: true, redirectTo: "/dashboard" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/dashboard")
        expect(client.verifyMagicLink).toHaveBeenCalledWith("magic-link-token", {
            redirect: false,
            redirectTo: "/dashboard",
        })
    })

    test("tracks isPending while verifying a magic link", async () => {
        const client = createMockClient()
        client.verifyMagicLink = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useVerifyMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.verifyMagicLink("magic-link-token")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
