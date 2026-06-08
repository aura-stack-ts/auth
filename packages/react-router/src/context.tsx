import { AuthProvider as Provider, type AuthProviderProps } from "@aura-stack/react/context"
import { useNavigate } from "react-router"
import type { User } from "@aura-stack/react"

const AuthProvider = <DefaultUser extends User = User>({
    client,
    children,
    initialSession,
    redirect,
}: AuthProviderProps<DefaultUser>) => {
    const navigate = useNavigate()

    const onRedirect = redirect || ((to) => navigate(to))

    return (
        <Provider client={client} initialSession={initialSession} redirect={onRedirect}>
            {children}
        </Provider>
    )
}

export { AuthProvider, type AuthProviderProps }
