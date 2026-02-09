import Link from "next/link"
import { ArrowRight } from "lucide-react"

const integrations = [
    {
        name: "Next.js",
        description: "Full-stack React framework with App Router and Pages Router support",
        variants: ["App Router", "Pages Router"],
        logo: (
            <svg className="size-12" viewBox="0 0 256 256" fill="none">
                <path
                    d="M128 0C57.308 0 0 57.307 0 128s57.308 128 128 128c70.693 0 128-57.307 128-128S198.693 0 128 0z"
                    fill="#000"
                />
                <path
                    d="M212.634 224.028L98.335 76.8H76.8v102.357h17.067V98.68l109.227 139.346c6.827-4.48 13.12-9.493 18.773-15.147l.767-.851z"
                    fill="#fff"
                />
                <path d="M163.556 76.8h17.067v102.4h-17.067V76.8z" fill="#fff" />
            </svg>
        ),
        link: "/docs",
    },
    {
        name: "Nuxt",
        description: "The intuitive Vue framework for building web applications",
        variants: [],
        logo: (
            <svg className="size-12" viewBox="0 0 256 256" fill="none">
                <path
                    d="M143.618 25.613l79.78 137.99c1.89 3.27 1.89 7.3 0 10.57-1.89 3.27-5.38 5.28-9.14 5.28H41.746c-3.76 0-7.25-2.01-9.14-5.28-1.89-3.27-1.89-7.3 0-10.57l79.78-137.99c1.89-3.27 5.38-5.28 9.14-5.28 3.76 0 7.25 2.01 9.14 5.28z"
                    fill="#00DC82"
                />
            </svg>
        ),
        link: "/docs",
    },
    {
        name: "React Router",
        description: "Declarative routing for React applications",
        variants: [],
        logo: (
            <svg className="size-12" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="128" fill="#CA4245" />
                <path
                    d="M128 64c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64zm0 112c-26.51 0-48-21.49-48-48s21.49-48 48-48 48 21.49 48 48-21.49 48-48 48z"
                    fill="#fff"
                />
            </svg>
        ),
        link: "/docs",
    },
    {
        name: "TanStack Start",
        description: "Full-stack React framework powered by TanStack Router",
        variants: [],
        logo: (
            <svg className="size-12" viewBox="0 0 256 256" fill="none">
                <circle cx="128" cy="128" r="128" fill="#00C7B7" />
                <path
                    d="M128 32L64 96h128l-64-64zm0 192l64-64H64l64 64zm-64-96l64-64v128l-64-64zm128 0l-64 64V64l64 64z"
                    fill="#fff"
                />
            </svg>
        ),
        link: "/docs",
    },
]

export const Integrations = () => {
    return (
        <section className="px-6 border-t border-white/10">
            <div className="max-w-6xl px-6 py-20 mx-auto border-x border-white/20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">Integrations</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        First-class support for popular frameworks with working integration examples
                    </p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {integrations.map((integration) => (
                        <Link
                            key={integration.name}
                            href={integration.link}
                            className="group p-6 flex items-center justify-between flex-col border border-white/10 bg-black transition-all duration-300"
                        >
                            <div className="flex flex-col items-center text-center mb-4">
                                <div className="mb-4">{integration.logo}</div>
                                <h3 className="text-xl font-semibold text-white mb-2 transition-colors">{integration.name}</h3>
                                {integration.variants.length > 0 && (
                                    <div className="flex gap-2 mb-3">
                                        {integration.variants.map((variant) => (
                                            <span
                                                key={variant}
                                                className="px-2 py-1 text-xs rounded-full bg-white/10 text-white/70"
                                            >
                                                {variant}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                <p className="text-sm text-white/70 leading-relaxed mb-4">{integration.description}</p>
                            </div>
                            <div className="inline-flex items-center gap-1 text-sm group-hover:gap-2 transition-all w-full justify-center">
                                View example <ArrowRight className="size-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
