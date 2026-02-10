import type { createAuthClient } from "./client"
import type { Session } from "@aura-stack/auth"
import type { PropsWithChildren } from "react"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: ReturnType<typeof createAuthClient>["signIn"]
    signOut: ReturnType<typeof createAuthClient>["signOut"]
}

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}
