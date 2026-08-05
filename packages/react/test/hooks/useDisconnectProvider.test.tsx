import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useDisconnectProvider } from "@/hooks.ts"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useDisconnectProvider", () => {
    test("useDisconnectProvider outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useDisconnectProvider())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully disconnects provider", async () => {
        const client = createMockClient()
        client.disconnectProvider = vi.fn().mockResolvedValueOnce(undefined)

        const { result } = renderHook(() => useDisconnectProvider(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await result.current.disconnectProvider("github")
        })

        expect(client.disconnectProvider).toHaveBeenCalledWith("github")
    })

    test("handles client provider disconnection errors gracefully", async () => {
        const client = createMockClient()
        client.disconnectProvider = vi.fn().mockRejectedValueOnce(new Error("Disconnection failed"))

        const { result } = renderHook(() => useDisconnectProvider(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.disconnectProvider("github")).rejects.toThrow("Disconnection failed")
        })
    })

    test("disconnectProvider with isPending state tracking", async () => {
        const client = createMockClient()
        client.disconnectProvider = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
        })

        const { result } = renderHook(() => useDisconnectProvider(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.disconnectProvider("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled interface elements when disconnecting provider is pending", async () => {
        const user = userEvent.setup()
        const client = createMockClient()

        client.disconnectProvider = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(undefined), 100)
            })
        })

        const DisconnectProviderButton = () => {
            const { disconnectProvider, isPending } = useDisconnectProvider()

            return (
                <button disabled={isPending} onClick={() => disconnectProvider("google")}>
                    {isPending ? "Disconnecting..." : "Disconnect Google"}
                </button>
            )
        }

        render(<DisconnectProviderButton />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const targetButton = screen.getByRole("button", { name: "Disconnect Google" })
        await user.click(targetButton)

        expect(screen.getByRole("button", { name: "Disconnecting..." })).toBeDefined()
    })
})
