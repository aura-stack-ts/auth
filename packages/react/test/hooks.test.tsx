import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { AuthProvider } from "@/context.tsx"
import { useSession, useSignIn, useSignInCredentials, useSignOut, useUpdateSession } from "@/hooks.ts"
import type { ReactNode } from "react"
import type { AuthClientInstance } from "@/@types/types.ts"

const mockUser = { id: "1", email: "test@example.com", name: "Test User" }
const mockSession = { user: mockUser, expires: new Date(Date.now() + 3600 * 1000).toISOString() }

const createMockClient = () =>
    ({
        getSession: vi.fn().mockResolvedValue(mockSession),
        signIn: vi.fn().mockResolvedValue({ signInURL: "/api/auth/signIn" }),
        signInCredentials: vi.fn().mockResolvedValue({ redirectURL: "/dashboard" }),
        signOut: vi.fn().mockResolvedValue({ redirectURL: "/goodbye" }),
        updateSession: vi.fn().mockResolvedValue(mockSession),
    }) as unknown as AuthClientInstance

const redirectMock = vi.fn()

const wrapper = ({
    children,
    client,
    initialSession,
    redirect,
}: {
    children: ReactNode
    client: any
    initialSession?: any
    redirect?: any
}) => (
    <AuthProvider client={client} initialSession={initialSession} redirect={redirect}>
        {children}
    </AuthProvider>
)

afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
})

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
        vi.stubGlobal("window", { location: { assign: vi.fn() } })

        const client = createMockClient()
        const { result } = renderHook(() => useSignIn(), {
            wrapper: ({ children }) => wrapper({ children, client }),
        })

        await act(async () => {
            await result.current.signIn("github", { redirect: true, redirectTo: "/dashboard" })
        })

        expect(window.location.assign).toHaveBeenCalledWith("/api/auth/signIn")
        expect(client.signIn).toHaveBeenCalledWith("github", {
            // Note: redirect is forced to false to handle redirection manually
            // in the hook by `redirect` function from context
            redirect: false,
            redirectTo: "/dashboard",
        })
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
})
