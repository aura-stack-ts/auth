import type { createAuthClient } from "@/lib/client"
import type { Session } from "@aura-stack/auth"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: (typeof createAuthClient)["signIn"]
    signOut: (typeof createAuthClient)["signOut"]
}

export interface AuthServerContext {
    request: Request
    redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308 | 300 | 304) => Response
}
