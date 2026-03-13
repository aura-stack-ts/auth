import type { Session } from "@aura-stack/auth"
import type { authClient } from "@/lib/auth-client"
import type { Dispatch, SetStateAction } from "react"

export interface AuthContextValue {
    session: Session | null
    setSession: Dispatch<SetStateAction<Session | null>>
    isAuthenticated: boolean
    isLoading: boolean
    signIn: typeof authClient.signIn
    signOut: typeof authClient.signOut
}
