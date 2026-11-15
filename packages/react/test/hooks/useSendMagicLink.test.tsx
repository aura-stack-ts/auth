import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useSendMagicLink } from "@/hooks/index.ts"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
})

describe("useSendMagicLink", () => {
    test("useSendMagicLink outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSendMagicLink())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("sends a magic link without redirecting by default", async () => {
        const client = createMockClient()
        client.sendMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/check-email" })

        const { result } = renderHook(() => useSendMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendMagicLink("user@example.com")
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.sendMagicLink).toHaveBeenCalledWith("user@example.com", { redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.sendMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/check-email" })

        const { result } = renderHook(() => useSendMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendMagicLink("user@example.com", { redirect: false, redirectTo: "/check-email" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.sendMagicLink).toHaveBeenCalledWith("user@example.com", {
            redirect: false,
            redirectTo: "/check-email",
        })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.sendMagicLink = vi.fn().mockResolvedValue({ success: true, redirectURL: "/check-email" })

        const { result } = renderHook(() => useSendMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendMagicLink("user@example.com", { redirect: true, redirectTo: "/check-email" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/check-email")
        expect(client.sendMagicLink).toHaveBeenCalledWith("user@example.com", {
            redirect: false,
            redirectTo: "/check-email",
        })
    })

    test("tracks isPending while sending a magic link", async () => {
        const client = createMockClient()
        client.sendMagicLink = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useSendMagicLink(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.sendMagicLink("user@example.com")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
