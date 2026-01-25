import type { PropsWithChildren } from "react"
import type { OAuthProviderConfig, Session } from "@aura-stack/auth/types"

export interface OAuthProvider extends Omit<OAuthProviderConfig, "scope"> {
    scopes: string[]
    redirectURI: string
    configured: boolean
    clientIdInput: boolean
    clientSecretInput: boolean
}

export interface OAuthProvidersProps {
    providers: OAuthProvider[]
    isAuthenticated: boolean
}

export interface AuthProviderProps extends PropsWithChildren {
    session?: Session | null
}
