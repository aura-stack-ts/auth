import { Footer } from "@/components/footer"
import { Header } from "@/components/header"
import { Html, Head, Main, NextScript } from "next/document"

export default function Document() {
    return (
        <Html className="dark" lang="en">
            <Head />
            <body className="antialiased">
                <Header />
                <Main />
                <NextScript />
                <Footer />
            </body>
        </Html>
    )
}
