import { afterEach, describe, expect, test, vi } from "vitest"
import { render, renderHook, screen, waitFor } from "@testing-library/react"
import { useSession } from "@/hooks.ts"
import { createMockClient, mockSession, wrapper } from "@test/hooks/presets.tsx"

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

describe("useSession", () => {
    test("useSession without AuthProvider should throw an error", () => {
        expect(() => renderHook(() => useSession())).toThrow("Auth hooks must be used within an <AuthProvider>.")
    })

    test("useSession without initialSession should fetch the session", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSession(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(result.current).toEqual({
            session: null,
            isPending: true,
            status: "pending",
        })

        await waitFor(() => {
            expect(result.current).toEqual({
                session: mockSession,
                isPending: false,
                status: "authenticated",
            })
        })
    })

    test("useSession with initialSession", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        expect(result.current).toEqual({
            session: mockSession,
            isPending: false,
            status: "authenticated",
        })
        expect(client.getSession).not.toHaveBeenCalled()
    })

    test("useSession fetching session should handle errors gracefully", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockRejectedValue(new Error("Failed to fetch session"))

        const { result } = renderHook(() => useSession(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(result.current).toEqual({
            session: null,
            isPending: true,
            status: "pending",
        })

        await waitFor(() => {
            expect(result.current).toEqual({
                session: null,
                isPending: false,
                status: "unauthenticated",
            })
        })
    })

    test("renders loading while the session is being fetched", async () => {
        const client = createMockClient()

        const Page = () => {
            const { session, status } = useSession()
            if (status === "pending") {
                return <div>Loading...</div>
            }

            return status === "authenticated" ? <div>Authenticated: {session?.user.name}</div> : <div>Not authenticated</div>
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(screen.getByText("Loading...")).toBeTruthy()
        expect(await screen.findByText("Authenticated: Test User")).toBeTruthy()
        expect(client.getSession).toHaveBeenCalledTimes(1)
    })

    test("renders not authenticated when there is no session", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValue(null)

        const Page = () => {
            const { session, status } = useSession()
            if (status === "pending") {
                return <div>Loading...</div>
            }

            return status === "authenticated" ? <div>Authenticated: {session?.user.name}</div> : <div>Not authenticated</div>
        }

        render(<Page />, {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(await screen.findByText("Not authenticated")).toBeTruthy()
        expect(client.getSession).toHaveBeenCalledTimes(1)
    })
})
