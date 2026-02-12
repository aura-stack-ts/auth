import Link from "next/link"
import { Lock, Code2, Shield, Cookie, Layers, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const useCases = [
    {
        title: "OAuth 2.0 Integration",
        description:
            "Native support for multiple OAuth providers. Easily integrate GitHub, Discord, Google, and more with built-in provider configurations.",
        icon: Lock,
        link: "/docs/oauth",
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
        link: "/docs/concepts/security-model#token-management",
    },
    {
        title: "Cookie Security",
        description:
            "Secure, configurable cookies for session persistence. Proper security flags, domain settings, and SameSite attributes out of the box.",
        icon: Cookie,
        link: "/docs/guides/cookie-management",
    },
    {
        title: "Extensible Architecture",
        description:
            "Easily integrate with @aura-stack/router or custom routing layers. Build on top of a flexible, composable authentication foundation.",
        icon: Layers,
        link: "/docs/concepts/architecture",
    },
    {
        title: "Framework-Agnostic Design",
        description:
            "Works seamlessly in any environment that supports the Web Request/Response APIs. Deploy anywhere, from traditional servers to edge runtimes.",
        icon: Globe,
        link: "/docs/concepts/architecture",
    },
]

export const WhatYouGet = () => {
    return (
        <section className="px-6 border-t border-border">
            <div className="max-w-6xl py-20 mx-auto border-x border-border">
                <div className="mb-16 text-center">
                    <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">What You Get</h2>
                    <p className="max-w-2xl mx-auto text-lg text-white/70">
                        Everything you need to build secure, production-ready authentication workflows
                    </p>
                </div>
                <div className="p-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {useCases.map((useCase) => (
                        <Link
                            key={useCase.title}
                            href={useCase.link}
                            className="group p-6 size-full flex flex-col justify-start relative border border-border transition-all duration-300 bg-background hover:border-white/40"
                        >
                            <div className="mb-4">
                                <div className="size-12 flex items-center justify-center">
                                    <useCase.icon className="size-8 text-white" />
                                </div>
                            </div>
                            <h3 className="mb-2 text-xl font-semibold text-white transition-colors">{useCase.title}</h3>
                            <p className="mb-3 text-white/70 leading-relaxed">{useCase.description}</p>
                            <Button className="w-fit mt-auto bg-white/5" variant="outline" size="lg">
                                Try now
                            </Button>
                            <Image
                                className="w-full absolute bottom-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                width={400}
                                height={400}
                                src="/shape.png"
                                alt="Shape"
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
