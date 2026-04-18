import { AuthProvider } from "@/contexts/auth"
import { Layout } from "@/components/layout"
import { Geist, Geist_Mono } from "next/font/google"
import type { AppProps } from "next/app"
import type { Session } from "@aura-stack/auth"
import "@/styles/globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export default function App({ Component, pageProps }: AppProps) {
    const { initialSession, ...componentProps } = pageProps as AppProps["pageProps"] & {
        initialSession?: Session | null
    }

    return (
        <div className={`${geistSans.variable} ${geistMono.variable}`}>
            <title>Aura Auth | Next.js Pages Router Integration</title>
            <AuthProvider initialSession={initialSession}>
                <Layout>
                    <Component {...componentProps} />
                </Layout>
            </AuthProvider>
        </div>
    )
}
