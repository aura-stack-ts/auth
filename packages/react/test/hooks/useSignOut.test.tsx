import { afterEach, describe, expect, test, vi } from "vitest"
import { useSignOut } from "@/hooks.ts"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useSignOut", () => {
    test("useSignOut outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSignOut())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useSignOut with redirect: true (by default)", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signOut()
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signOut).toHaveBeenCalledWith({ redirect: false })
    })

    test("useSignOut with redirect: false and redirectTo", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signOut({ redirect: false, redirectTo: "/goodbye" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: "/goodbye" })
    })

    test("useSignOut with redirect: true and redirectTo", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signOut({ redirect: true, redirectTo: "/goodbye" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/goodbye")
        expect(client.signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: "/goodbye" })
    })

    test("useSignOut with redirect: true without redirect function", async () => {
        const assign = vi.fn()
        vi.stubGlobal("window", { location: { assign } })

        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await result.current.signOut({ redirect: true, redirectTo: "/goodbye" })
        })

        expect(assign).toHaveBeenCalledWith("/goodbye")
        expect(client.signOut).toHaveBeenCalledWith({ redirect: false, redirectTo: "/goodbye" })
    })

    test("useSignOut with isPending state", async () => {
        const postMessage = vi.fn()
        const onmessage = vi.fn()

        vi.stubGlobal(
            "BroadcastChannel",
            class {
                postMessage = postMessage
                addEventListener = (_: string, handler: (event: MessageEvent) => void) => {
                    onmessage.mockImplementation(handler)
                }
                removeEventListener = () => {}
                close = () => {}
            }
        )

        const client = createMockClient()

        client.signOut = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, redirectURL: "/goodbye" }), 100)
            })
        })

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.signOut({
            redirect: false,
            redirectTo: "/goodbye",
        })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
        expect(postMessage).toHaveBeenCalledWith({ type: "session:clear" })
    })

    test("render disable button when signOut is pending", async () => {
        const user = userEvent.setup()

        const client = createMockClient()

        client.signOut = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, redirectURL: "/goodbye" }), 100)
            })
        })

        const Page = () => {
            const { signOut, isPending } = useSignOut()
            return (
                <button onClick={() => signOut()} disabled={isPending}>
                    {isPending ? "Signing out..." : "Sign Out"}
                </button>
            )
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await user.click(screen.getByRole("button", { name: "Sign Out" }))
        expect(screen.getByRole("button", { name: "Signing out..." })).toBeDefined()
    })
})
