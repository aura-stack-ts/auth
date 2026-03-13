import { Geist, Geist_Mono } from "next/font/google"
import { Header } from "@/components/header"
import { AuthProvider } from "@/contexts/auth"
import { Footer } from "@/components/footer"
import { metadataInfo } from "@/lib/metadata"
import "./globals.css"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export const metadata = metadataInfo

export default function RootLayout({ children }: LayoutProps<"/">) {
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
