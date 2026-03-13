import type { Session } from "@aura-stack/auth"
import { authClient } from "~/actions/auth.client"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: (typeof authClient)["signIn"]
    signOut: (typeof authClient)["signOut"]
}
