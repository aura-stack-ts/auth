/**
 * @vitest-environment jsdom
 */
import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import type { AuthProviderProps } from "@aura-stack/react"

const { mockRouterPush, MockProvider } = vi.hoisted(() => ({
    mockRouterPush: vi.fn(),
    MockProvider: vi.fn(({ children }: AuthProviderProps) => <>{children}</>),
}))

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock("@aura-stack/react/context", () => ({
    AuthProvider: MockProvider,
}))

const mockClient = {} as AuthProviderProps["client"]

describe("AuthProvider — Next.js App Router", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("renders children into the DOM", async () => {
        const { AuthProvider } = await import("@/context")

        render(
            <AuthProvider client={mockClient}>
                <span>app router child</span>
            </AuthProvider>
        )

        expect(screen.getByText("app router child")).toBeTruthy()
    })

    test("uses router.push from next/navigation as the built-in redirect when no redirect prop is given", async () => {
        const { AuthProvider } = await import("@/context")

        render(<AuthProvider client={mockClient}>content</AuthProvider>)

        const { redirect } = MockProvider.mock.calls[0][0]
        expect(typeof redirect).toBe("function")

        redirect!("/dashboard")
        expect(mockRouterPush).toHaveBeenCalledWith("/dashboard")
    })

    test("calls the custom redirect fn with the correct URL and does NOT call router.push", async () => {
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
        expect(mockRouterPush).not.toHaveBeenCalled()
    })

    test("router.push is NOT called when a custom redirect prop is active", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()

        render(
            <AuthProvider client={mockClient} redirect={customRedirect}>
                content
            </AuthProvider>
        )

        const { redirect } = MockProvider.mock.calls[0][0]
        await redirect!("/settings")

        expect(mockRouterPush).not.toHaveBeenCalled()
    })

    test("passes client and initialSession props through to the inner Provider unchanged", async () => {
        const { AuthProvider } = await import("@/context")
        const session = { user: { sub: "u1", name: "Alice" }, expires: "2099-01-01" } as any

        render(
            <AuthProvider client={mockClient} initialSession={session}>
                content
            </AuthProvider>
        )

        const received = MockProvider.mock.calls[0][0]
        expect(received.client).toBe(mockClient)
        expect(received.initialSession).toBe(session)
    })
})
