import { AuthProvider as Provider, type AuthProviderProps } from "@aura-stack/react/context"
import { useRouter } from "next/router"

/**
 * Wrapper component that provides authentication context for Next.js Pages Router applications.
 * Falls back to `router.push` from `next/router` when no custom `redirect` prop is supplied.
 *
 * @example
 * const client = createAuthClient({ baseURL: "http://localhost:3000" })
 *
 * <AuthProvider client={client}>
 *   <App />
 * </AuthProvider>
 */
const AuthProvider = ({ client, children, initialSession, redirect }: AuthProviderProps) => {
    const router = useRouter()

    const onRedirect: (to: string) => void = redirect ?? ((to: string) => router.push(to))

    return (
        <Provider client={client} initialSession={initialSession} redirect={onRedirect}>
            {children}
        </Provider>
    )
}

export { AuthProvider, type AuthProviderProps }
