import { Outlet } from "react-router"
import { Header } from "~/components/header"
import { Footer } from "~/components/footer"
import { AuthProvider } from "~/contexts/auth"
import type { Route } from "./+types/auth-layout"
import { api } from "~/lib/auth"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await api.getSession({
        headers: request.headers,
    })
    return session
}

const AuthLayout = ({ loaderData }: Route.ComponentProps) => {
    const session = loaderData.session
    return (
        <AuthProvider initialSession={session}>
            <Header />
            <Outlet />
            <Footer />
        </AuthProvider>
    )
}

export default AuthLayout
