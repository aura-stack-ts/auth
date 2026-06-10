import { vi } from "vitest"
import { AuthProvider } from "@/context.tsx"
import type { AuthClientInstance, AuthProviderProps } from "@/@types/types.ts"
import type { Session, User } from "@aura-stack/auth"

export const mockUser = { id: "1", email: "test@example.com", name: "Test User" } as unknown as User
export const mockSession = { user: mockUser, expires: new Date(Date.now() + 3600 * 1000).toISOString() } as Session

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
        signUp: vi.fn().mockResolvedValue({ redirectURL: "/welcome" }),
    }) as Partial<AuthClientInstance> as AuthClientInstance

export const wrapper = ({ children, client, initialSession, redirect }: AuthProviderProps) => (
    <AuthProvider client={client} initialSession={initialSession} redirect={redirect}>
        {children}
    </AuthProvider>
)
