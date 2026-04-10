import { AuthProvider as AuraAuthProvider, type AuthProviderProps } from "@aura-stack/react"
import { authClient } from "@/lib/auth-client"

export const AuthProvider = ({ children, initialSession }: Omit<AuthProviderProps, "client">) => {
    return (
        <AuraAuthProvider client={authClient} initialSession={initialSession}>
            {children}
        </AuraAuthProvider>
    )
}
