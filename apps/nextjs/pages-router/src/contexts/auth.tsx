import { AuthProvider as AuraAuthProvider, type AuthProviderProps } from "@aura-stack/react"
import { authClient } from "@/lib/client"

export const AuthProvider = ({ children }: Omit<AuthProviderProps, "client">) => {
    return <AuraAuthProvider client={authClient}>{children}</AuraAuthProvider>
}
