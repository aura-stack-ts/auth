import { afterEach, describe, expect, test, vi } from "vitest"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useProviderTokens } from "@/hooks.ts"
import { createMockClient, mockSession, providerTokens, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useProviderTokens", () => {
    test("useProviderTokens without AuthProvider should throw an error", () => {
        expect(() => renderHook(() => useProviderTokens())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("successfully fetches provider tokens from the client", async () => {
        const client = createMockClient()
        client.getProviderTokens = vi.fn().mockResolvedValueOnce({
            success: true,
            tokens: providerTokens,
        })

        const { result } = renderHook(() => useProviderTokens(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        let output
        await act(async () => {
            output = await result.current.getProviderTokens("github")
        })

        expect(client.getProviderTokens).toHaveBeenCalledWith("github")
        expect(output).toEqual({
            success: true,
            tokens: providerTokens,
        })
    })

    test("handles client token fetching errors gracefully", async () => {
        const client = createMockClient()
        client.getProviderTokens = vi.fn().mockRejectedValueOnce(new Error("Failed to fetch provider tokens"))

        const { result } = renderHook(() => useProviderTokens(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await expect(result.current.getProviderTokens("google")).rejects.toThrow("Failed to fetch provider tokens")
        })
    })

    test("getProviderTokens with isPending state tracking", async () => {
        const client = createMockClient()
        client.getProviderTokens = vi.fn().mockImplementation(() => {
            return new Promise((resolve) =>
                setTimeout(
                    () =>
                        resolve({
                            success: true,
                            tokens: providerTokens,
                        }),
                    100
                )
            )
        })

        const { result } = renderHook(() => useProviderTokens(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.getProviderTokens("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disabled action layout element when fetching tokens is pending", async () => {
        const user = userEvent.setup()

        const client = createMockClient()
        client.getProviderTokens = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(
                    () =>
                        resolve({
                            success: true,
                            tokens: providerTokens,
                        }),
                    100
                )
            })
        })

        const TokenViewer = () => {
            const { getProviderTokens, isPending } = useProviderTokens()

            return (
                <div>
                    <button disabled={isPending} onClick={() => getProviderTokens("github")}>
                        {isPending ? "Loading Tokens..." : "Load Github Tokens"}
                    </button>
                </div>
            )
        }

        render(<TokenViewer />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const button = screen.getByRole("button", { name: "Load Github Tokens" })
        await user.click(button)

        await waitFor(() => {
            expect(screen.getByRole("button", { name: "Loading Tokens..." })).toBeDefined()
        })
    })
})
