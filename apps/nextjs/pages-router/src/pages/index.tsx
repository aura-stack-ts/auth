import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const flow = [
    {
        title: "Overview",
        body: "This demo compares two rendering strategies for the same auth flow in Next.js Pages Router while sharing the same Aura Auth.",
        href: "https://aura-stack-auth.vercel.app/",
        external: true,
    },
    {
        title: "Server-Side Rendering",
        body: "Session is resolved in getServerSideProps and hydrated through AuthProvider to preserve server-driven auth state on first render.",
        href: "/server/profile",
        external: false,
    },
    {
        title: "Client-Side Rendering",
        body: "The same auth operations are driven through useAuth in client-side interactions to demonstrate pending states and browser-driven updates.",
        href: "/client/sign-in",
        external: false,
    },
]

export default function Home() {
    return (
        <main className="min-h-container relative flex flex-col overflow-hidden">
            <section className="flex-1 w-11/12 max-w-6xl mx-auto p-6 flex items-center relative border-b border-x border-muted">
                <div className="space-y-7 max-w-4xl">
                    <h1 className="text-4xl font-bold">Next.js Auth</h1>
                    <p className="max-w-2xl text-base text-muted-foreground">
                        A focused integration showcase for comparing authentication behavior across server-side and client-side
                        rendering in Next.js Pages Router. Explore each implementation and inspect how the same flow is expressed
                        through getServerSideProps and Client-Side interactions.
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Button variant="secondary" asChild>
                            <Link href="/server/profile">
                                Open SSR Reference
                                <ArrowRight className="size-3" />
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/client/sign-in">
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
                                        href={item.href}
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
