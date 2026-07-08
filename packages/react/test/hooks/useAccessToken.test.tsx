import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useAccessToken } from "@/hooks.ts" // Adjust path to where your hook is exported

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useAccessToken", () => {
    test("useAccessToken outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useAccessToken())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully fetches access token string from the client", async () => {
        const client = createMockClient()
        const mockTokenString = "gho_abcdef1234567890"

        client.getAccessToken = vi.fn().mockResolvedValueOnce(mockTokenString)

        const { result } = renderHook(() => useAccessToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.getAccessToken("github")
        })

        expect(client.getAccessToken).toHaveBeenCalledWith("github")
        expect(output).toBe(mockTokenString)
    })

    test("returns null if the provider is valid but has no active token matching context", async () => {
        const client = createMockClient()
        client.getAccessToken = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useAccessToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.getAccessToken("google")
        })

        expect(client.getAccessToken).toHaveBeenCalledWith("google")
        expect(output).toBeNull()
    })

    test("handles client access token retrieval errors gracefully", async () => {
        const client = createMockClient()
        client.getAccessToken = vi.fn().mockRejectedValueOnce(new Error("Session verification expired"))

        const { result } = renderHook(() => useAccessToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.getAccessToken("github")).rejects.toThrow("Session verification expired")
        })
    })

    test("getAccessToken with isPending state tracking", async () => {
        const client = createMockClient()
        client.getAccessToken = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve("mock-token-string"), 100))
        })

        const { result } = renderHook(() => useAccessToken(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        // Execute the action context without awaiting to intercept intermediate renders
        const call = result.current.getAccessToken("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled interface elements when fetching target token is pending", async () => {
        const user = userEvent.setup()
        const client = createMockClient()

        client.getAccessToken = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve("mock-token-string"), 100)
            })
        })

        const AccessTokenButton = () => {
            const { getAccessToken, isPending } = useAccessToken()

            return (
                <button disabled={isPending} onClick={() => getAccessToken("google")}>
                    {isPending ? "Retrieving Token..." : "Get Google Token"}
                </button>
            )
        }

        render(<AccessTokenButton />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const targetButton = screen.getByRole("button", { name: "Get Google Token" })
        await user.click(targetButton)

        expect(screen.getByRole("button", { name: "Retrieving Token..." })).toBeDefined()
    })
})
