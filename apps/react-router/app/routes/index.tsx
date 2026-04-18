import { Footer } from "~/components/footer"
import { ArrowRight } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Link } from "react-router"

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
        href: "/server",
        external: false,
    },
    {
        title: "Client-Side Rendering",
        body: "The same auth operations are driven through useAuth in client-side interactions to demonstrate pending states and browser-driven updates.",
        href: "/client",
        external: false,
    },
]

const IndexPage = () => {

    return (
        <main className="min-h-container relative flex flex-col overflow-hidden bg-black">
            <section className="flex-1 w-11/12 max-w-6xl mx-auto p-6 flex items-center relative border-b border-x border-muted">
                <div className="space-y-7 max-w-4xl">
                    <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-7xl">
                        <span className="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text">
                            React Router Auth
                        </span>
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                        A focused integration showcase for comparing authentication behavior across server-side and client-side
                        rendering. Explore each implementation and inspect how the same flow is expressed through loaders/actions
                        and client hooks.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button variant="secondary" asChild>
                            <Link to="/server">
                                Open SSR Reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link to="/client">
                                Open CSR Reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
            <section className="w-11/12 p-6 max-w-6xl mx-auto border-x border-muted">
                <div className="grid gap-4 md:grid-cols-3">
                    {flow.map((item) => (
                        <article className="p-6 flex flex-col border border-muted" key={item.title}>
                            <h2 className="text-3xl tracking-tight text-white">{item.title}</h2>
                            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                            <Button className="w-min mt-6" variant="outline" asChild>
                                <Link to={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noopener noreferrer" : undefined}>
                                    Try Now
                                </Link>
                            </Button>
                        </article>
                    ))}
                </div>
            </section>
            <Footer />
        </main>
    )
}

export default IndexPage
