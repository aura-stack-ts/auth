import Link from "next/link"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const integrations = [
    {
        name: "Next.js",
        description: "Full-stack React framework with App Router and Pages Router support",
        link: "https://github.com/aura-stack-ts/auth/tree/master/apps/nextjs",
    },
    {
        name: "Nuxt",
        description: "The intuitive Vue framework for building web applications",
        link: "https://github.com/aura-stack-ts/auth/tree/master/apps/nuxt",
    },
    {
        name: "React Router",
        description: "Declarative routing for React applications",
        link: "https://github.com/aura-stack-ts/auth/tree/master/apps/react-router",
    },
    {
        name: "TanStack Start",
        description: "Full-stack React framework powered by TanStack Router",
        link: "https://github.com/aura-stack-ts/auth/tree/master/apps/tanstack-start",
    },
]

export const Integrations = () => {
    return (
        <section className="px-6 border-t border-border">
            <div className="max-w-6xl px-6 py-20 mx-auto border-x border-border">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">Integrations</h2>
                    <p className="max-w-2xl mx-auto text-lg text-white/70">
                        First-class support for popular frameworks with working integration examples
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {integrations.map((integration) => (
                        <Link
                            key={integration.name}
                            href={integration.link}
                            className="group p-6 flex items-start justify-between flex-col relative border border-border transition-all duration-300 bg-background hover:border-white/40"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <div className="mb-4 flex flex-col items-start text-start relative z-10">
                                <h3 className="mb-2 text-xl font-semibold text-white transition-colors">{integration.name}</h3>
                                <p className="mb-4 text-sm text-white/70 leading-relaxed">{integration.description}</p>
                            </div>
                            <Button className="w-fit mt-auto bg-white/5" variant="outline" size="lg">
                                View Example
                            </Button>
                            <Image
                                className="w-full absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                width={100}
                                height={100}
                                src="/shape-top.png"
                                alt=""
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
