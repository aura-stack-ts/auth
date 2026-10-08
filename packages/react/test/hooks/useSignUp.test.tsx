import { afterEach, describe, expect, test, vi } from "vitest"
import { useSignUp } from "@/hooks.ts"
import { act, render, renderHook, screen, waitFor } from "@testing-library/react"
import { createMockClient, wrapper } from "@test/hooks/presets.tsx"
import { userEvent } from "@testing-library/user-event"
import type { SubmitEvent } from "react"

const redirectMock = vi.fn()

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

const payload = {
    name: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "123456789",
}

describe("useSignUp", () => {
    test("useSignUp outside of AuthProvider should throw error", () => {
        expect(() => renderHook(() => useSignUp())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useSignUp with redirect: true (by default)", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignUp(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signUp({
                payload,
            })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signUp).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("useSignUp with redirect: false and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignUp(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signUp({
                payload,
                redirect: false,
                redirectTo: "/welcome",
            })
        })

        expect(redirectMock).not.toHaveBeenCalled()
        expect(client.signUp).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/welcome" })
    })

    test("useSignUp with redirect: true and redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignUp(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signUp({
                payload,
                redirect: true,
                redirectTo: "/welcome",
            })
        })

        expect(redirectMock).toHaveBeenCalledWith("/welcome")
        expect(client.signUp).toHaveBeenCalledWith({ payload, redirect: false, redirectTo: "/welcome" })
    })

    test("useSignUp with redirect: true and no redirectTo", async () => {
        const assign = vi.fn()
        vi.stubGlobal("window", { location: { assign } })

        const client = createMockClient()
        const { result } = renderHook(() => useSignUp(), {
            wrapper: ({ children }) => wrapper({ children, client, redirect: redirectMock }),
        })

        await act(async () => {
            await result.current.signUp({
                payload,
                redirect: true,
            })
        })

        expect(redirectMock).toHaveBeenCalledWith("/welcome")
        expect(client.signUp).toHaveBeenCalledWith({ payload, redirect: false })
    })

    test("useSignUp with isPending state", async () => {
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

        client.signUp = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true }), 100)
            })
        })

        const { result } = renderHook(() => useSignUp(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        const call = result.current.signUp({
            payload,
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

    test("render disabled button while signing up", async () => {
        const user = userEvent.setup()

        const client = createMockClient()

        client.signUp = vi.fn().mockImplementation(() => {
            return new Promise((resolve) => {
                setTimeout(() => resolve({ success: true }), 100)
            })
        })

        const Page = () => {
            const { signUp, isPending } = useSignUp()

            const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const entries = Object.fromEntries(formData.entries())
                await signUp({ payload: entries })
            }

            return (
                <form onSubmit={handleSubmit}>
                    <input name="name" aria-label="Name" />
                    <input name="lastName" aria-label="Last Name" />
                    <input name="email" aria-label="Email" defaultValue="" />
                    <input name="password" aria-label="Password" defaultValue="" />
                    <button type="submit" disabled={isPending}>
                        {isPending ? "Signing Up..." : "Sign Up"}
                    </button>
                </form>
            )
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        await user.type(screen.getByLabelText("Name"), "John")
        await user.type(screen.getByLabelText("Last Name"), "Doe")
        await user.type(screen.getByLabelText("Email"), "johndoe@example.com")
        await user.type(screen.getByLabelText("Password"), "123456789")
        await user.click(screen.getByRole("button", { name: "Sign Up" }))
        expect(screen.getByRole("button", { name: "Signing Up..." })).toBeDefined()
    })
})
