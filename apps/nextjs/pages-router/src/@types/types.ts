import { authClient } from "@/lib/client"
import type { Session } from "@aura-stack/auth"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: ReturnType<typeof authClient>["signIn"]
    signOut: ReturnType<typeof authClient>["signOut"]
}
