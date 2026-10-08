import { RootProvider } from "fumadocs-ui/provider/next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "@/app/global.css"
import { Metadata } from "next"

const inter = Inter({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-inter",
})

export const metadata: Metadata = {
    title: {
        default: "Aura Auth | Authentication for the Modern Web",
        template: "%s | Aura Auth",
    },
}

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={inter.className} suppressHydrationWarning>
            <body className="flex flex-col min-h-screen overflow-x-hidden">
                <RootProvider>{children}</RootProvider>
                <Analytics />
            </body>
        </html>
    )
}
