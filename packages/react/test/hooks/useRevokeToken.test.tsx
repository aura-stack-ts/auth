import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useRevokeToken } from "@/hooks.ts"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useRevokeToken", () => {
    test("useRevokeToken outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useRevokeToken())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully revokes token for provider", async () => {
        const client = createMockClient()
        client.revokeToken = vi.fn().mockResolvedValueOnce(undefined)

        const { result } = renderHook(() => useRevokeToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await result.current.revokeToken("github")
        })

        expect(client.revokeToken).toHaveBeenCalledWith("github")
    })

    test("handles client token revocation errors gracefully", async () => {
        const client = createMockClient()
        client.revokeToken = vi.fn().mockRejectedValueOnce(new Error("Token revocation failed"))

        const { result } = renderHook(() => useRevokeToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.revokeToken("github")).rejects.toThrow("Token revocation failed")
        })
    })

    test("revokeToken with isPending state tracking", async () => {
        const client = createMockClient()
        client.revokeToken = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
        })

        const { result } = renderHook(() => useRevokeToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.revokeToken("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled interface elements when revoking token is pending", async () => {
        const user = userEvent.setup()
        const client = createMockClient()

        client.revokeToken = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve(undefined), 100)
            })
        })

        const RevokeTokenButton = () => {
            const { revokeToken, isPending } = useRevokeToken()

            return (
                <button disabled={isPending} onClick={() => revokeToken("google")}>
                    {isPending ? "Revoking Token..." : "Revoke Google Token"}
                </button>
            )
        }

        render(<RevokeTokenButton />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const targetButton = screen.getByRole("button", { name: "Revoke Google Token" })
        await user.click(targetButton)

        expect(screen.getByRole("button", { name: "Revoking Token..." })).toBeDefined()
    })
})
