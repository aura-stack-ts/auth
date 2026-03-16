import type { Session } from "@aura-stack/auth"
import type { authClient } from "@/lib/auth-client"

export interface AuthContextValue {
    session: Session | null
    isAuthenticated: boolean
    isLoading: boolean
    signIn: typeof authClient.signIn
    signOut: typeof authClient.signOut
}
