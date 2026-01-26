import { createAuthClient } from "@/lib/client"
import type { Session } from "@aura-stack/auth"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: ReturnType<typeof createAuthClient>["signIn"]
    signOut: ReturnType<typeof createAuthClient>["signOut"]
}
