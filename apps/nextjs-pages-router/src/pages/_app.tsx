import { AuthProvider } from "@/contexts/auth"
import { Layout } from "@/components/layout"
import type { AppProps } from "next/app"
import "@/styles/globals.css"

export default function App({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider session={pageProps?.session ?? null}>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </AuthProvider>
    )
}
