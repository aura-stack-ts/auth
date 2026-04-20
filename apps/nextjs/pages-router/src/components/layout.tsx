import { Header } from "@/components/header"
import type { PropsWithChildren } from "react"

export const Layout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <Header />
            {children}
        </>
    )
}
