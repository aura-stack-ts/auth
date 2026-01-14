import { Outlet } from "react-router"
import { AuthProvider } from "~/contexts/auth"
import { getSession } from "~/lib/auth.client"
import type { Route } from "./+types/auth-layout"

export const clientLoader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request)
    return session
}

export const HydrateFallback = () => {
    return <p>Loading...</p>
}

const AuthLayout = ({ loaderData }: Route.ComponentProps) => {
    const session = loaderData
    return (
        <AuthProvider session={session}>
            <Outlet />
        </AuthProvider>
    )
}

export default AuthLayout
