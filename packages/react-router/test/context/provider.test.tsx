import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { AuthClientInstance, AuthProviderProps } from "@/@types/index"

/**
 * vi.hoisted ensures mock references are stable across the hoisting boundary —
 * vi.mock factories run before imports, so ordinary variables defined in the
 * module scope would be undefined inside those factories.
 */
const { mockNavigate, MockProvider } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    MockProvider: vi.fn(({ children }: AuthProviderProps) => <>{children}</>),
}))

vi.mock("@aura-stack/react/context", () => ({
    AuthProvider: MockProvider,
}))

vi.mock("react-router", () => ({
    useNavigate: () => mockNavigate,
}))

const mockClient = {} as AuthClientInstance

describe("AuthProvider (react-router)", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("renders children into the DOM", async () => {
        const { AuthProvider } = await import("@/context")

        render(
            <AuthProvider client={mockClient}>
                <span>hello world</span>
            </AuthProvider>
        )

        expect(screen.getByText("hello world")).toBeTruthy()
    })

    test("passes a custom redirect prop directly to the inner Provider", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()

        render(
            <AuthProvider client={mockClient} redirect={customRedirect}>
                content
            </AuthProvider>
        )

        const props = MockProvider.mock.calls[0][0]
        expect(props.redirect).toBe(customRedirect)
    })

    test("wraps navigate as the built-in redirect when no redirect prop is supplied", async () => {
        const { AuthProvider } = await import("@/context")

        render(<AuthProvider client={mockClient}>content</AuthProvider>)

        const { redirect } = MockProvider.mock.calls[0][0]
        expect(typeof redirect).toBe("function")

        redirect!("/dashboard")
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard")
    })

    test("calls the custom redirect fn with the correct URL and does NOT call navigate", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()

        render(
            <AuthProvider client={mockClient} redirect={customRedirect}>
                content
            </AuthProvider>
        )

        const { redirect } = MockProvider.mock.calls[0][0]
        await redirect!("/profile")

        expect(customRedirect).toHaveBeenCalledOnce()
        expect(customRedirect).toHaveBeenCalledWith("/profile")
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test("calls navigate when no redirect prop is provided and redirect fn is invoked", async () => {
        const { AuthProvider } = await import("@/context")

        render(<AuthProvider client={mockClient}>content</AuthProvider>)

        const { redirect } = MockProvider.mock.calls[0][0]
        await redirect!("/home")

        expect(mockNavigate).toHaveBeenCalledOnce()
        expect(mockNavigate).toHaveBeenCalledWith("/home")
    })

    test("navigate is NOT called when a custom redirect prop overrides the built-in", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()

        render(
            <AuthProvider client={mockClient} redirect={customRedirect}>
                content
            </AuthProvider>
        )

        const { redirect } = MockProvider.mock.calls[0][0]
        await redirect!("/settings")

        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test("passes client and initialSession props through to the inner Provider unchanged", async () => {
        const { AuthProvider } = await import("@/context")
        const session = { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" } as any

        render(
            <AuthProvider client={mockClient} initialSession={session}>
                content
            </AuthProvider>
        )

        const props = MockProvider.mock.calls[0][0]
        expect(props.client).toBe(mockClient)
        expect(props.initialSession).toBe(session)
    })
})
