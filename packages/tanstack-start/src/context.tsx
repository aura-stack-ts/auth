import { AuthProvider as Provider, type AuthProviderProps } from "@aura-stack/react/context"
import { useNavigate } from "@tanstack/react-router"
import type { User } from "@aura-stack/react"

/**
 * Wrapper component that provides authentication context for TanStack React applications.
 *
 * @example
 * const client = createAuthClient({ baseURL: "http://localhost:3000" })
 *
 * <AuthProvider client={client}>
 *   <App />
 * </AuthProvider>
 */
const AuthProvider = <DefaultUser extends User = User>({
    client,
    children,
    initialSession,
    redirect,
}: AuthProviderProps<DefaultUser>) => {
    const router = useNavigate()

    const onRedirect = redirect ?? ((to: string) => router({ to }))

    return (
        <Provider client={client} initialSession={initialSession} redirect={onRedirect}>
            {children}
        </Provider>
    )
}

export { AuthProvider, type AuthProviderProps }
