import Link from "next/link"
import { ArrowRight, Lock, Code2, Shield, Cookie, Layers, Globe } from "lucide-react"

const useCases = [
    {
        title: "OAuth 2.0 Integration",
        description:
            "Native support for multiple OAuth providers. Easily integrate GitHub, Discord, Google, and more with built-in provider configurations.",
        icon: Lock,
        link: "/docs",
    },
    {
        title: "Type-Safe Development",
        description:
            "First-class TypeScript support with complete type inference. Build authentication flows with confidence and catch errors at compile time.",
        icon: Code2,
        link: "/docs",
    },
    {
        title: "Secure Session Management",
        description:
            "Built-in JWT-based session management with encryption and signing. Sessions are encrypted by default with configurable expiration policies.",
        icon: Shield,
        link: "/docs",
    },
    {
        title: "Cookie Security",
        description:
            "Secure, configurable cookies for session persistence. Proper security flags, domain settings, and SameSite attributes out of the box.",
        icon: Cookie,
        link: "/docs",
    },
    {
        title: "Extensible Architecture",
        description:
            "Easily integrate with @aura-stack/router or custom routing layers. Build on top of a flexible, composable authentication foundation.",
        icon: Layers,
        link: "/docs",
    },
    {
        title: "Framework-Agnostic Design",
        description:
            "Works seamlessly in any environment that supports the Web Request/Response APIs. Deploy anywhere, from traditional servers to edge runtimes.",
        icon: Globe,
        link: "/docs",
    },
]

export const ExploreUseCases = () => {
    return (
        <section className="px-6 border-t border-white/10">
            <div className="max-w-6xl py-20 mx-auto border-x border-white/20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">Explore Use Cases</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Core features and capabilities that power secure authentication workflows
                    </p>
                </div>
                <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {useCases.map((useCase) => (
                        <Link
                            key={useCase.title}
                            href={useCase.link}
                            className="group p-6 border border-white/20 bg-black transition-all duration-300"
                        >
                            <div className="mb-4">
                                <div className="size-12 flex items-center justify-center">
                                    <useCase.icon className="size-8 text-white" />
                                </div>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2 transition-colors">{useCase.title}</h3>
                            <p className="text-white/70 leading-relaxed mb-3">{useCase.description}</p>
                            <div className="inline-flex items-center gap-1 text-sm group-hover:gap-2 transition-all">
                                Learn more <ArrowRight className="size-4" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
