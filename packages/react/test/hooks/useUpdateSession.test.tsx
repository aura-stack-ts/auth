import { afterEach, describe, expect, test, vi } from "vitest"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { useUpdateSession } from "@/hooks.ts"
import type { SubmitEvent } from "react"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useUpdateSession", () => {
    test("useUpdateSession outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useUpdateSession())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useUpdateSession with redirect: true (by default)", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { session: { user: { name: "New Name" } } }
        await act(async () => {
            await result.current.updateSession(partial)
        })

        expect(client.updateSession).toHaveBeenCalledWith({ ...partial, redirect: false })
    })

    test("useUpdateSession with redirect: false and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { session: { user: { name: "New Name" } }, redirect: false, redirectTo: "/dashboard" }
        await act(async () => {
            await result.current.updateSession(partial)
        })

        expect(client.updateSession).toHaveBeenCalledWith({ ...partial, redirect: false, redirectTo: "/dashboard" })
    })

    test("useUpdateSession with redirect: true and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { session: { user: { name: "New Name" } }, redirect: true, redirectTo: "/dashboard" }
        await act(async () => {
            await result.current.updateSession(partial)
        })

        expect(client.updateSession).toHaveBeenCalledWith({ ...partial, redirect: false, redirectTo: "/dashboard" })
    })

    test("useUpdateSession with redirect: true without redirect function", async () => {
        const assign = vi.fn()
        vi.stubGlobal("window", { location: { assign } })

        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { session: { user: { name: "New Name" } }, redirect: true, redirectTo: "/dashboard" }
        await act(async () => {
            await result.current.updateSession(partial)
        })

        expect(assign).toHaveBeenCalledWith("/dashboard")
        expect(client.updateSession).toHaveBeenCalledWith({ ...partial, redirect: false, redirectTo: "/dashboard" })
    })

    test("updateSession with isPending state", async () => {
        const client = createMockClient()
        client.updateSession = vi.fn().mockImplementation(() => {
            return new Promise((resolve) =>
                setTimeout(
                    () =>
                        resolve({
                            success: true,
                        }),
                    100
                )
            )
        })

        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const call = result.current.updateSession({ session: { user: { name: "New Name" } } })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
    })

    test("render disable button when updateSession is pending", async () => {
        const user = userEvent.setup()

        const client = createMockClient()
        client.updateSession = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(
                    () =>
                        resolve({
                            success: true,
                        }),
                    100
                )
            })
        })

        const Page = () => {
            const { updateSession, isPending } = useUpdateSession()

            const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const name = formData.get("name") as string
                await updateSession({ session: { user: { name } } })
            }

            return (
                <form onSubmit={handleSubmit}>
                    <input type="text" name="name" placeholder="Name" aria-label="Name" />
                    <button disabled={isPending}>{isPending ? "Updating..." : "Update Session"}</button>
                </form>
            )
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await user.click(screen.getByRole("button", { name: "Update Session" }))
        expect(screen.getByRole("button", { name: "Updating..." })).toBeDefined()
    })
})
