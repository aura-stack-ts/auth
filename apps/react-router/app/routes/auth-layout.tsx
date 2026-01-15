import { Outlet } from "react-router"
import { AuthProvider } from "~/contexts/auth"
import { getSession } from "~/actions/auth"
import type { Route } from "./+types/auth-layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request)
    return session
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
