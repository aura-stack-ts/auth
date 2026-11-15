import { afterEach, describe, expect, test, vi } from "vitest"
import { act, renderHook, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { useVerifyEmail } from "@/hooks/index.ts"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
})

describe("useVerifyEmail", () => {
    test("useVerifyEmail outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useVerifyEmail())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("verifies the token without redirecting by default", async () => {
        const client = createMockClient()
        client.verifyEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verified" })

        const { result } = renderHook(() => useVerifyEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmail("verification-token")
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyEmail).toHaveBeenCalledWith("verification-token", { redirect: false })
    })

    test("preserves redirectTo while keeping client-side redirect disabled", async () => {
        const client = createMockClient()
        client.verifyEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verified" })

        const { result } = renderHook(() => useVerifyEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmail("verification-token", { redirect: false, redirectTo: "/verified" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.verifyEmail).toHaveBeenCalledWith("verification-token", {
            redirect: false,
            redirectTo: "/verified",
        })
    })

    test("uses the provider redirect when redirect is true", async () => {
        const client = createMockClient()
        client.verifyEmail = vi.fn().mockResolvedValue({ success: true, redirectURL: "/verified" })

        const { result } = renderHook(() => useVerifyEmail(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.verifyEmail("verification-token", { redirect: true, redirectTo: "/verified" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/verified")
        expect(client.verifyEmail).toHaveBeenCalledWith("verification-token", {
            redirect: false,
            redirectTo: "/verified",
        })
    })

    test("tracks isPending while verifying an email", async () => {
        const client = createMockClient()
        client.verifyEmail = vi
            .fn()
            .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)))

        const { result } = renderHook(() => useVerifyEmail(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })
        const call = result.current.verifyEmail("verification-token")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })
})
