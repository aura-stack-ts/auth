import { AuthProvider as Provider, type AuthProviderProps } from "@aura-stack/react/context"
import { useNavigate } from "react-router"

const AuthProvider = ({ client, children, initialSession, redirect }: AuthProviderProps) => {
    const navigate = useNavigate()

    const onRedirect = redirect || ((to) => navigate(to))

    return (
        <Provider client={client} initialSession={initialSession} redirect={onRedirect}>
            {children}
        </Provider>
    )
}

export { AuthProvider, type AuthProviderProps }
