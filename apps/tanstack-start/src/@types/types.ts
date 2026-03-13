import type { Session } from "@aura-stack/auth"
import type { Dispatch, SetStateAction } from "react"
import { authClient } from "@/lib/auth-client"

export interface AuthContextValue {
    session: Session | null
    setSession: Dispatch<SetStateAction<Session | null>>
    isAuthenticated: boolean
    isLoading: boolean
    signIn: (typeof authClient)["signIn"]
    signOut: (typeof authClient)["signOut"]
}
