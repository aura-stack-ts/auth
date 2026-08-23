import { Link } from "react-router"
import { ArrowRight } from "lucide-react"
import { Footer } from "~/components/footer"
import { Button } from "~/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card"

const flow = [
    {
        title: "Overview",
        body: "This demo compares two rendering strategies for the same auth flow in React Router while sharing the same Aura Auth.",
        href: "https://aura-stack-auth.vercel.app/",
        external: true,
    },
    {
        title: "Server-Side Rendering",
        body: "Session is resolved in React Router loaders and auth actions are executed on the server through route actions.",
        href: "/server/sign-in",
        external: false,
    },
    {
        title: "Client-Side Rendering",
        body: "The same auth operations are driven through useAuth in client-side interactions to demostrate client-driven.",
        href: "/client/sign-in",
        external: false,
    },
]

const IndexPage = () => {
    return (
        <main className="min-h-container relative flex flex-col overflow-hidden">
            <section className="flex-1 w-11/12 max-w-6xl mx-auto p-6 flex items-center relative border-b border-x border-muted">
                <div className="space-y-7 max-w-4xl">
                    <h1 className="text-4xl font-bold">React Router Auth</h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        A focused integration showcase for comparing authentication behavior across server-side and client-side
                        rendering. Explore each implementation and inspect how the same flow is expressed through loaders/actions
                        and client hooks.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button variant="secondary" asChild>
                            <Link to="/server/sign-in">
                                Open SSR Reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/client/sign-in">
                                Open CSR Reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
            <section className="w-11/12 p-6 max-w-6xl mx-auto border-x border-muted">
                <div className="grid gap-6 md:grid-cols-3">
                    {flow.map((item) => (
                        <Card key={item.title}>
                            <CardHeader>
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.body}</CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button variant="outline" asChild>
                                    <Link
                                        to={item.href}
                                        target={item.external ? "_blank" : undefined}
                                        rel={item.external ? "noopener noreferrer" : undefined}
                                    >
                                        Try Now
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </section>
            <Footer />
        </main>
    )
}

export default IndexPage
