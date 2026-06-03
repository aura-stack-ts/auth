import { vi } from "vitest"
import { AuthProvider } from "@/context.tsx"
import type { ReactNode } from "react"
import type { AuthClientInstance } from "@/@types/types.ts"

export const mockUser = { id: "1", email: "test@example.com", name: "Test User" }
export const mockSession = { user: mockUser, expires: new Date(Date.now() + 3600 * 1000).toISOString() }

export const createMockClient = () =>
    ({
        getSession: vi.fn().mockResolvedValue(mockSession),
        signIn: vi.fn().mockResolvedValue({ signInURL: "/api/auth/signIn" }),
        signInCredentials: vi.fn().mockResolvedValue({ redirectURL: "/dashboard" }),
        signOut: vi.fn().mockResolvedValue({ redirectURL: "/goodbye" }),
        updateSession: vi.fn().mockResolvedValue({
            session: mockSession,
            redirectURL: "/dashboard",
        }),
    }) as unknown as AuthClientInstance

export const wrapper = ({
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
