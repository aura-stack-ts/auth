import { AuthProvider as AuraAuthProvider, type AuthProviderProps } from "@aura-stack/react"
import { authClient } from "~/actions/auth.client"

export const AuthProvider = ({ children }: Omit<AuthProviderProps, "client">) => {
    return <AuraAuthProvider client={authClient}>{children}</AuraAuthProvider>
}
