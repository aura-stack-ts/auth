import type { Session } from "@aura-stack/auth"
import type { BuiltInOAuthProvider } from "@aura-stack/auth/oauth/index"
import type { LiteralUnion } from "@aura-stack/auth/types"

export interface AuthContextValue {
    session: Session | null
    isLoading: boolean
    isAuthenticated: boolean
    signIn: (provider: LiteralUnion<BuiltInOAuthProvider>) => Promise<void>
    signOut: () => Promise<void>
}
