import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useIsProviderConnected } from "@/hooks.ts"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useIsProviderConnected", () => {
    test("useIsProviderConnected outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useIsProviderConnected())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully checks if provider is connected", async () => {
        const client = createMockClient()
        client.isProviderConnected = vi.fn().mockResolvedValueOnce(true)

        const { result } = renderHook(() => useIsProviderConnected(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.isProviderConnected("github")
        })

        expect(client.isProviderConnected).toHaveBeenCalledWith("github")
        expect(output).toBe(true)
    })

    test("returns false when provider is not connected", async () => {
        const client = createMockClient()
        client.isProviderConnected = vi.fn().mockResolvedValueOnce(false)

        const { result } = renderHook(() => useIsProviderConnected(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.isProviderConnected("google")
        })

        expect(client.isProviderConnected).toHaveBeenCalledWith("google")
        expect(output).toBe(false)
    })

    test("handles client connection check errors gracefully", async () => {
        const client = createMockClient()
        client.isProviderConnected = vi.fn().mockRejectedValueOnce(new Error("Network error"))

        const { result } = renderHook(() => useIsProviderConnected(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.isProviderConnected("github")).rejects.toThrow("Network error")
        })
    })

    test("isProviderConnected with isPending state tracking", async () => {
        const client = createMockClient()
        client.isProviderConnected = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve(true), 100))
        })

        const { result } = renderHook(() => useIsProviderConnected(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.isProviderConnected("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled interface elements when checking connection is pending", async () => {
        const user = userEvent.setup()
        const client = createMockClient()

        client.isProviderConnected = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(true), 100)
            })
        })

        const CheckConnectionButton = () => {
            const { isProviderConnected, isPending } = useIsProviderConnected()

            return (
                <button disabled={isPending} onClick={() => isProviderConnected("google")}>
                    {isPending ? "Checking Connection..." : "Check Google Connection"}
                </button>
            )
        }

        render(<CheckConnectionButton />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const targetButton = screen.getByRole("button", { name: "Check Google Connection" })
        await user.click(targetButton)

        expect(screen.getByRole("button", { name: "Checking Connection..." })).toBeDefined()
    })
})
