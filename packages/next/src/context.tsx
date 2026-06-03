"use client"

import { User } from "@aura-stack/react"
import { AuthProvider as Provider, type AuthProviderProps } from "@aura-stack/react/context"
import { useRouter } from "next/navigation"

/**
 * Wrapper component that provides authentication context for Next.js App Router applications.
 * Falls back to `router.push` from `next/navigation` when no custom `redirect` prop is supplied.
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
    const router = useRouter()

    const onRedirect = redirect ?? ((to: string) => router.push(to))

    return (
        <Provider client={client} initialSession={initialSession} redirect={onRedirect}>
            {children}
        </Provider>
    )
}

export { AuthProvider, type AuthProviderProps }
