import type { OAuthConfig } from "@aura-stack/auth/types"

export interface OAuthProvider extends Omit<OAuthConfig, "scope"> {
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
