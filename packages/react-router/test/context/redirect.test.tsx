import { describe, expect, test, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { useSignOut, useSignIn } from "@aura-stack/react"
import type { AuthClientInstance } from "@/@types"

const mockNavigate = vi.hoisted(() => vi.fn())

vi.mock("react-router", () => ({
    useNavigate: () => mockNavigate,
}))

const createMockClient = (overrides: Partial<AuthClientInstance> = {}): AuthClientInstance => {
    return {
        getSession: vi.fn().mockResolvedValue(null),
        signOut: vi.fn().mockResolvedValue({
            success: true,
            redirectURL: "/",
            redirect: false,
            headers: new Headers(),
        }),
        signIn: vi.fn().mockResolvedValue({
            success: true,
            signInURL: "/oauth/github/callback",
            redirect: false,
        }),
        signInCredentials: vi.fn().mockResolvedValue({
            success: true,
            redirectURL: "/dashboard",
            redirect: false,
            headers: new Headers(),
        }),
        updateSession: vi.fn().mockResolvedValue({
            success: true,
            session: null,
            redirectURL: null,
            headers: new Headers(),
        }),
        ...overrides,
    } as unknown as AuthClientInstance
}

const SignOutTrigger = ({ onError }: { onError?: (e: unknown) => void }) => {
    const { signOut } = useSignOut()
    return (
        <button
            onClick={async () => {
                try {
                    await signOut({ redirect: true })
                } catch (e) {
                    onError?.(e)
                }
            }}
        >
            Sign Out
        </button>
    )
}

const SignInTrigger = () => {
    const { signIn } = useSignIn()
    return <button onClick={() => signIn("github", { redirect: true } as any)}>Sign In</button>
}

describe("AuthProvider (react-router) — redirect integration", () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test("signOut with redirect:true calls the built-in navigate with the redirectURL", async () => {
        const { AuthProvider } = await import("@/context")
        const client = createMockClient()

        render(
            <AuthProvider client={client}>
                <SignOutTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign Out"))
        })

        expect(mockNavigate).toHaveBeenCalledWith("/")
    })

    test("signOut with redirect:true calls the custom redirect fn and NOT navigate", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()
        const client = createMockClient()

        render(
            <AuthProvider client={client} redirect={customRedirect}>
                <SignOutTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign Out"))
        })

        expect(customRedirect).toHaveBeenCalledWith("/")
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test("signIn OAuth with redirect:true calls navigate with the signInURL", async () => {
        const { AuthProvider } = await import("@/context")
        const client = createMockClient()

        render(
            <AuthProvider client={client}>
                <SignInTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign In"))
        })

        expect(mockNavigate).toHaveBeenCalledWith("/oauth/github/callback")
    })

    test("signIn OAuth with redirect:true calls custom redirect fn instead of navigate", async () => {
        const { AuthProvider } = await import("@/context")
        const customRedirect = vi.fn()
        const client = createMockClient()

        render(
            <AuthProvider client={client} redirect={customRedirect}>
                <SignInTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign In"))
        })

        expect(customRedirect).toHaveBeenCalledWith("/oauth/github/callback")
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    test("edge case: undefined redirect prop falls back to navigate", async () => {
        const { AuthProvider } = await import("@/context")
        const client = createMockClient()

        render(
            <AuthProvider client={client} redirect={undefined}>
                <SignOutTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign Out"))
        })

        expect(mockNavigate).toHaveBeenCalledWith("/")
    })

    test("signOut with success:false and null redirectURL does NOT call navigate", async () => {
        const { AuthProvider } = await import("@/context")
        const client = createMockClient({
            signOut: vi.fn().mockResolvedValue({
                success: false,
                redirectURL: null,
                redirect: false,
                headers: new Headers(),
            }),
        })

        render(
            <AuthProvider client={client}>
                <SignOutTrigger />
            </AuthProvider>
        )

        await act(async () => {
            fireEvent.click(screen.getByText("Sign Out"))
        })

        expect(mockNavigate).not.toHaveBeenCalled()
    })
})
