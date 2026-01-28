import { Outlet } from "react-router"
import { getSession } from "~/actions/auth"
import { Header } from "~/components/header"
import { Footer } from "~/components/footer"
import { AuthProvider } from "~/contexts/auth"
import type { Route } from "./+types/auth-layout"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request)
    return session
}

const AuthLayout = ({ loaderData }: Route.ComponentProps) => {
    const session = loaderData
    return (
        <AuthProvider session={session}>
            <Header />
            <Outlet />
            <Footer />
        </AuthProvider>
    )
}

export default AuthLayout
