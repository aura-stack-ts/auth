import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useRefreshUserInfo } from "@/hooks.ts"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useRefreshUserInfo", () => {
    test("useRefreshUserInfo outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useRefreshUserInfo())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully refreshes user info for provider", async () => {
        const client = createMockClient()
        const refreshedSession = { ...mockSession, user: { ...mockSession.user, name: "Updated Name" } }
        client.refreshUserInfo = vi.fn().mockResolvedValueOnce(refreshedSession)

        const { result } = renderHook(() => useRefreshUserInfo(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.refreshUserInfo("github")
        })

        expect(client.refreshUserInfo).toHaveBeenCalledWith("github")
        expect(output).toEqual(refreshedSession)
    })

    test("returns null when refresh fails", async () => {
        const client = createMockClient()
        client.refreshUserInfo = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useRefreshUserInfo(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.refreshUserInfo("google")
        })

        expect(client.refreshUserInfo).toHaveBeenCalledWith("google")
        expect(output).toBeNull()
    })

    test("handles client user info refresh errors gracefully", async () => {
        const client = createMockClient()
        client.refreshUserInfo = vi.fn().mockRejectedValueOnce(new Error("Refresh failed"))

        const { result } = renderHook(() => useRefreshUserInfo(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.refreshUserInfo("github")).rejects.toThrow("Refresh failed")
        })
    })

    test("refreshUserInfo with isPending state tracking", async () => {
        const client = createMockClient()
        client.refreshUserInfo = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve(mockSession), 100))
        })

        const { result } = renderHook(() => useRefreshUserInfo(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.refreshUserInfo("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled interface elements when refreshing user info is pending", async () => {
        const user = userEvent.setup()
        const client = createMockClient()

        client.refreshUserInfo = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(mockSession), 100)
            })
        })

        const RefreshUserInfoButton = () => {
            const { refreshUserInfo, isPending } = useRefreshUserInfo()

            return (
                <button disabled={isPending} onClick={() => refreshUserInfo("google")}>
                    {isPending ? "Refreshing..." : "Refresh Google Info"}
                </button>
            )
        }

        render(<RefreshUserInfoButton />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const targetButton = screen.getByRole("button", { name: "Refresh Google Info" })
        await user.click(targetButton)

        expect(screen.getByRole("button", { name: "Refreshing..." })).toBeDefined()
    })
})
