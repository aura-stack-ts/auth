import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useSendVerificationEmail } from "@/hooks.ts"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
})

describe("useSendVerificationEmail", () => {
    test("useSendVerificationEmail outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSendVerificationEmail())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("sends a verification email without redirecting by default", async () => {
        const client = createMockClient()
        client.sendVerificationEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verify-sent" })

        const { result } = renderHook(() => useSendVerificationEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendVerificationEmail("user@example.com")
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.sendVerificationEmail).toHaveBeenCalledWith("user@example.com", { redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.sendVerificationEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verify-sent" })

        const { result } = renderHook(() => useSendVerificationEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendVerificationEmail("user@example.com", {
                redirect: false,
                redirectTo: "/verify-sent",
            })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.sendVerificationEmail).toHaveBeenCalledWith("user@example.com", {
            redirect: false,
            redirectTo: "/verify-sent",
        })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.sendVerificationEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verify-sent" })

        const { result } = renderHook(() => useSendVerificationEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.sendVerificationEmail("user@example.com", {
                redirect: true,
                redirectTo: "/verify-sent",
            })
        })

        expect(redirectMock).toHaveBeenCalledWith("/verify-sent")
        expect(client.sendVerificationEmail).toHaveBeenCalledWith("user@example.com", {
            redirect: false,
            redirectTo: "/verify-sent",
        })
    })

    test("tracks isPending while sending a verification email", async () => {
        const client = createMockClient()
        client.sendVerificationEmail = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useSendVerificationEmail(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.sendVerificationEmail("user@example.com")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
