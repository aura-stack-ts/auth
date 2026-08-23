import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google"
import { Header } from "@/components/header"
import { metadataInfo } from "@/lib/metadata"
import { AuthProvider } from "@/contexts/auth"
import "@/app/globals.css"
import { cn } from "@/lib/utils";

const jetbrainsMono = JetBrains_Mono({subsets:['latin'],variable:'--font-mono'});

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
        <html className={cn("dark", "font-mono", jetbrainsMono.variable)} lang="en">
            <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
                <AuthProvider>
                    <Header />
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
