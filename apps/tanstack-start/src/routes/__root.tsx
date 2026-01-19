import { type PropsWithChildren } from "react"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"
import appCss from "../styles.css?url"
import { AuthProvider } from "@/contexts/auth"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export const Route = createRootRoute({
    head: () => ({
        meta: [
            {
                charSet: "utf-8",
            },
            {
                name: "viewport",
                content: "width=device-width, initial-scale=1",
            },
            {
                title: "Aura Auth + TanStack Start",
            },
        ],
        links: [
            {
                rel: "stylesheet",
                href: appCss,
            },
        ],
    }),

    shellComponent: RootDocument,
})

function RootDocument({ children }: PropsWithChildren) {
    return (
        <html lang="en" className="dark">
            <head>
                <HeadContent />
            </head>
            <body>
                <AuthProvider>
                    <Header />
                    {children}
                    <Footer />
                </AuthProvider>
                <TanStackDevtools
                    config={{
                        position: "bottom-right",
                    }}
                    plugins={[
                        {
                            name: "Tanstack Router",
                            render: <TanStackRouterDevtoolsPanel />,
                        },
                    ]}
                />
                <Scripts />
            </body>
        </html>
    )
}
