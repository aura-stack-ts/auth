import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { userEvent } from "@testing-library/user-event"
import { afterEach, describe, expect, test, vi } from "vitest"
import { useSignIn } from "@/hooks.ts"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useSignIn", () => {
    test("useSignIn outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSignIn())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useSignIn with redirect: true (by default)", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signIn("github")
        })

        expect(redirectMock).not.toHaveBeenCalledOnce()
        expect(client.signIn).toHaveBeenCalledWith("github", { redirect: false })
    })

    test("useSignIn with redirect: false and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signIn("github", { redirect: false, redirectTo: "/dashboard" })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signIn).toHaveBeenCalledWith("github", { redirect: false, redirectTo: "/dashboard" })
    })

    test("useSignIn with redirect: true and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signIn("github", { redirect: true, redirectTo: "/dashboard" })
        })

        expect(redirectMock).toHaveBeenCalledWith("/api/auth/signIn")
        expect(client.signIn).toHaveBeenCalledWith("github", {
            // Note: redirect is forced to false to handle redirection manually
            // in the hook by `redirect` function from context
            redirect: false,
            redirectTo: "/dashboard",
        })
    })

    test("useSignIn with redirect: true without redirect function", async () => {
        const assign = vi.fn()
        vi.stubGlobal("window", { location: { assign } })

        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        await act(async () => {
            await result.current.signIn("github", { redirect: true, redirectTo: "/dashboard" })
        })

        expect(assign).toHaveBeenCalledWith("/api/auth/signIn")
        expect(client.signIn).toHaveBeenCalledWith("github", {
            // Note: redirect is forced to false to handle redirection manually
            // in the hook by `redirect` function from context
            redirect: false,
            redirectTo: "/dashboard",
        })
    })

    test("useSignIn with isPending state", async () => {
        const client = createMockClient()

        client.signIn = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve({ success: true, session: null, redirectURL: "" }), 100))
        })

        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        const call = result.current.signIn("github")

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })
        expect(result.current.isPending).toBe(false)
    })

    test("renders disabled button while signIn is pending", async () => {
        const user = userEvent.setup()

        const client = createMockClient()
        client.signIn = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => setTimeout(() => resolve({ success: true, session: null, redirectURL: "" }), 100))
        })

        const Page = () => {
            const { signIn, isPending } = useSignIn()
            return (
                <button onClick={() => signIn("github")} disabled={isPending}>
                    {isPending ? "Signing in..." : "Sign In with GitHub"}
                </button>
            )
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(screen.getByRole("button", { name: "Sign In with GitHub" })).toBeDefined()
        await user.click(screen.getByRole("button"))
        expect(screen.getByRole("button", { name: "Signing in..." })).toBeDefined()
    })
})
