import { RootProvider } from "fumadocs-ui/provider/next"
import "@/ui/global.css"
import { Geist } from "next/font/google"

const geist = Geist({
    weight: ["400", "500", "700"],
    subsets: ["latin"],
    variable: "--font-geist",
})

export default function Layout({ children }: LayoutProps<"/">) {
    return (
        <html lang="en" className={geist.className} suppressHydrationWarning>
            <body className="flex flex-col min-h-screen">
                <RootProvider>{children}</RootProvider>
            </body>
        </html>
    )
}
