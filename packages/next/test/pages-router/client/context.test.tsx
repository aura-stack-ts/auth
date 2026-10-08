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

vi.mock("next/router", () => ({
    useRouter: () => ({ push: mockRouterPush }),
}))

vi.mock("@aura-stack/react/context", () => ({
    AuthProvider: MockProvider,
}))

const mockClient = {} as AuthProviderProps["client"]

describe("AuthProvider — Next.js Pages Router", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("renders children into the DOM", async () => {
        const { AuthProvider } = await import("@/pages/context")

        render(
            <AuthProvider client={mockClient}>
                <span>pages router child</span>
            </AuthProvider>
        )

        expect(screen.getByText("pages router child")).toBeTruthy()
    })

    test("uses router.push from next/router as the built-in redirect when no redirect prop is given", async () => {
        const { AuthProvider } = await import("@/pages/context")

        render(<AuthProvider client={mockClient}>content</AuthProvider>)

        const { redirect } = MockProvider.mock.calls[0][0]
        expect(typeof redirect).toBe("function")

        redirect!("/legacy-page")
        expect(mockRouterPush).toHaveBeenCalledWith("/legacy-page")
    })

    test("calls the custom redirect fn and does NOT call router.push when override is provided", async () => {
        const { AuthProvider } = await import("@/pages/context")
        const customRedirect = vi.fn()

        render(
            <AuthProvider client={mockClient} redirect={customRedirect}>
                content
            </AuthProvider>
        )

        const { redirect } = MockProvider.mock.calls[0][0]
        await redirect!("/custom-path")

        expect(customRedirect).toHaveBeenCalledOnce()
        expect(customRedirect).toHaveBeenCalledWith("/custom-path")
        expect(mockRouterPush).not.toHaveBeenCalled()
    })

    test("router.push is NOT called when a custom redirect prop is active", async () => {
        const { AuthProvider } = await import("@/pages/context")
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

    test("passes client and initialSession through to the inner Provider unchanged", async () => {
        const { AuthProvider } = await import("@/pages/context")
        const session = { user: { sub: "u2", name: "Bob" }, expires: "2099-01-01" } as any

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
