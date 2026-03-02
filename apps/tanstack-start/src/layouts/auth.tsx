import { AuthProvider } from "@/contexts/auth"
import type { PropsWithChildren } from "react"

export const AuthLayout = ({ children }: PropsWithChildren) => {
    return <AuthProvider>{children}</AuthProvider>
}
