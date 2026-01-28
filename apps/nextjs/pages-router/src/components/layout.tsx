import type { PropsWithChildren } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const Layout = ({ children }: PropsWithChildren) => {
    return (
        <>
            <Header />
            {children}
            <Footer />
        </>
    )
}
