import { afterEach, describe, expect, test, vi } from "vitest"
import { useSignInCredentials } from "@/hooks.ts"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import type { SubmitEvent } from "react"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useSignInCredentials", () => {
    test("useSignInCredentials outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSignInCredentials())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useSignInCredentials with redirect: true (by default)", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        const payload = { username: "test@example.com", password: "password" }
        await act(async () => {
            await result.current.signInCredentials({
                payload,
            })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signInCredentials).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("useSignInCredentials with redirect: false and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        const payload = { username: "test@example.com", password: "password" }
        await act(async () => {
            await result.current.signInCredentials({
                payload,
                redirect: false,
                redirectTo: "/dashboard",
            })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signInCredentials).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/dashboard" })
    })

    test("useSignInCredentials with redirect: true and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        const payload = { username: "test@example.com", password: "password" }
        await act(async () => {
            await result.current.signInCredentials({
                payload,
                redirect: true,
                redirectTo: "/dashboard",
            })
        })

        expect(redirectMock).toHaveBeenCalledWith("/dashboard")
        expect(client.signInCredentials).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/dashboard" })
    })

    test("useSignInCredentials with redirect: true without redirect function", async () => {
        const assign = vi.fn()
        vi.stubGlobal("window", { location: { assign } })

        const client = createMockClient()
        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        const payload = { username: "test@example.com", password: "password" }
        await act(async () => {
            await result.current.signInCredentials({
                payload,
                redirect: true,
                redirectTo: "/dashboard",
            })
        })

        expect(assign).toHaveBeenCalledWith("/dashboard")
        expect(client.signInCredentials).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/dashboard" })
    })

    test("useSignInCredentials with isPending state", async () => {
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

        client.signInCredentials = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, session: null, redirectURL: "" }), 100)
            })
        })

        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        const call = result.current.signInCredentials({
            payload: {
                username: "johndoe",
                password: "password",
            },
        })

        await waitFor(() => {
            expect(result.current.isPending).toBe(true)
        })

        await act(async () => {
            await call
        })

        expect(result.current.isPending).toBe(false)
        expect(postMessage).toHaveBeenCalledWith({ type: "session:sync" })
    })

    test("render disabled button while signing in", async () => {
        const user = userEvent.setup()

        const client = createMockClient()

        client.signInCredentials = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true, session: null, redirectURL: "" }), 100)
            })
        })

        const Page = () => {
            const { signInCredentials, isPending } = useSignInCredentials()

            const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const username = formData.get("username") as string
                const password = formData.get("password") as string
                await signInCredentials({ payload: { username, password }, redirect: false })
            }

            return (
                <form onSubmit={handleSubmit}>
                    <input name="username" type="text" placeholder="Username" required aria-label="Username" />
                    <input name="password" type="password" placeholder="Password" required aria-label="Password" />
                    <button type="submit" disabled={isPending}>
                        {isPending ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            )
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        await user.type(screen.getByLabelText("Username"), "johndoe")
        await user.type(screen.getByLabelText("Password"), "password")
        await user.click(screen.getByRole("button", { name: "Sign In" }))
        expect(screen.getByRole("button", { name: "Signing in..." })).toBeDefined()
    })
})
