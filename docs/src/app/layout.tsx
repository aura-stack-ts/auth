import { RootProvider } from "fumadocs-ui/provider/next"
import { Inter } from "next/font/google"
import "@/app/global.css"

const inter = Inter({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-inter",
})

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={inter.className} suppressHydrationWarning>
            <body className="flex flex-col min-h-screen overflow-x-hidden">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    )
}
