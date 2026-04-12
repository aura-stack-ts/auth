import { act, renderHook, waitFor } from "@testing-library/react"
import { describe, expect, test, vi } from "vitest"
import { AuthProvider } from "@/context.tsx"
import { useAuth, useSession, useSignIn, useSignInCredentials, useSignOut, useUpdateSession } from "@/hooks.ts"
import type { ReactNode } from "react"
import type { AuthClientInstance } from "@/@types/types.ts"

const mockUser = { id: "1", email: "test@example.com", name: "Test User" }
const mockSession = { user: mockUser, expires: new Date(Date.now() + 3600 * 1000).toISOString() }

const createMockClient = () =>
    ({
        getSession: vi.fn().mockResolvedValue(mockSession),
        signIn: vi.fn().mockResolvedValue({ url: "/api/auth/signin" }),
        signInCredentials: vi.fn().mockResolvedValue({ url: "/api/auth/signin" }),
        signOut: vi.fn().mockResolvedValue({ url: "/api/auth/signout" }),
        updateSession: vi.fn().mockResolvedValue(mockSession),
    }) as unknown as AuthClientInstance

const wrapper = ({ children, client, initialSession }: { children: ReactNode; client: any; initialSession?: any }) => (
    <AuthProvider client={client} initialSession={initialSession}>
        {children}
    </AuthProvider>
)

describe("@aura-stack/react hooks", () => {
    test("useSession with initialSession", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        expect(result.current.session).toEqual(mockSession)
        expect(result.current.status).toBe("authenticated")
        expect(client.getSession).not.toHaveBeenCalled()
    })

    test("useSignIn with redirect: false", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: null }),
        })

        await act(async () => {
            await result.current("github", { redirect: false })
        })

        expect(client.signIn).toHaveBeenCalledWith("github", { redirect: false })
        await waitFor(() => expect(client.getSession).toHaveBeenCalledTimes(1))
    })

    test("useSignIn with redirectTo", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: null }),
        })

        await act(async () => {
            await result.current("github", { redirectTo: "/dashboard", redirect: true })
        })

        expect(client.signIn).toHaveBeenCalledWith("github", {
            redirectTo: "/dashboard",
            redirect: true,
        })
    })

    test("useSignInCredentials with redirect: false", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useSignInCredentials(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: null }),
        })

        const credentials = { username: "test@example.com", password: "password" }
        await act(async () => {
            await result.current(credentials, { redirect: false })
        })

        expect(client.signInCredentials).toHaveBeenCalledWith(credentials, { redirect: false })
        await waitFor(() => expect(client.getSession).toHaveBeenCalledTimes(1))
    })

    test("useSignOut calls client.signOut and refreshes session when redirect is false", async () => {
        const client = createMockClient()
        client.getSession = vi.fn().mockResolvedValueOnce(null)

        const { result } = renderHook(() => useSignOut(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        await act(async () => {
            await result.current({ redirect: false })
        })

        expect(client.signOut).toHaveBeenCalledWith({ redirect: false })
        await waitFor(() => expect(client.getSession).toHaveBeenCalledTimes(1))
    })

    test("useUpdateSession with refresh", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { user: { name: "New Name" } }
        await act(async () => {
            await result.current(partial)
        })

        expect(client.updateSession).toHaveBeenCalledWith(partial)
        await waitFor(() => expect(client.getSession).toHaveBeenCalledTimes(1))
    })

    test("useUpdateSession with skipRefresh", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useUpdateSession(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        const partial = { user: { name: "New Name" } }
        await act(async () => {
            await result.current(partial, { skipRefresh: true })
        })

        expect(client.updateSession).toHaveBeenCalledWith(partial)
        expect(client.getSession).not.toHaveBeenCalled()
    })

    test("useAuth returns full context value", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => wrapper({ children, client, initialSession: mockSession }),
        })

        expect(result.current.session).toEqual(mockSession)
        expect(result.current.status).toBe("authenticated")
        expect(typeof result.current.signIn).toBe("function")
        expect(typeof result.current.signOut).toBe("function")
        expect(result.current.client).toBe(client)
    })

    test("context status transitions from loading to authenticated on mount", async () => {
        const client = createMockClient()
        const { result } = renderHook(() => useAuth(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        expect(result.current.status).toBe("loading")

        await waitFor(() => expect(result.current.status).toBe("authenticated"))
        expect(result.current.session).toEqual(mockSession)
    })
})
