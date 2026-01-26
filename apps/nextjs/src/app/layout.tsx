import type { Metadata } from "next"
import type { PropsWithChildren } from "react"
import { Geist, Geist_Mono } from "next/font/google"
import { Header } from "@/components/header"
import { AuthProvider } from "@/contexts/auth"
import { Footer } from "@/components/footer"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata: Metadata = {
    title: {
        default: "Aura Auth | Next.js Integration Example",
        template: "%s | Aura Auth",
    },
    description:
        "Comprehensive authentication for TypeScript applications. Built for speed, security, and developer experience. Powered by Aura Auth Core.",
    keywords: ["Next.js", "Authentication", "Aura Auth", "TypeScript", "OAuth", "Session Management", "Security"],
    authors: [{ name: "Aura Stack Labs", url: "https://github.com/aura-stack-ts" }],
    creator: "Aura Stack Labs",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://aura-stack-auth.vercel.app/",
        siteName: "Aura Auth",
        title: "Aura Auth | Next.js Integration",
        description:
            "Seamlessly integrate secure authentication into your Next.js apps with Aura Auth Core. Supports OAuth and server-side sessions.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Aura Auth | Next.js Integration",
        description: "Secure authentication for Next.js powered by Aura Auth Core. Fast, secure, and developer-friendly.",
        creator: "@aurastackjs",
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
}

export default function RootLayout({
    children,
}: Readonly<PropsWithChildren>) {
    return (
        <html className="dark" lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}>
                <AuthProvider>
                    <Header />
                    {children}
                    <Footer />
                </AuthProvider>
            </body>
        </html>
    )
}
