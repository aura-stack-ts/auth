import { Outlet } from "react-router"
import { Header } from "~/components/header"
import { AuthProvider } from "~/contexts/auth"
const AuthLayout = () => {
    return (
        <AuthProvider>
            <Header />
            <Outlet />
        </AuthProvider>
    )
}

export default AuthLayout
