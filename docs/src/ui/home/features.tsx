import Link from "next/link"
import { ArrowRight, Code2, Globe, Lock, Shield, Zap } from "lucide-react"
import { SectionHeader } from "@/ui/home/section-header"

const features = [
    {
        title: "OAuth 2.0 Support",
        desc: "Easily integrate multiple OAuth providers with built-in support for GitHub, Discord, Figma, and more.",
        icon: Lock,
    },
    {
        title: "Session Management",
        desc: "Secure session handling with encrypted cookies, JWT tokens, and configurable expiration policies.",
        icon: Shield,
    },
    {
        title: "Provider Integration",
        desc: "Seamlessly connect with external OAuth providers and services through a unified API.",
        icon: Code2,
    },
    {
        title: "Framework Agnostic",
        desc: "Works with any JavaScript runtime that supports the Web Request/Response API.",
        icon: Globe,
    },
    {
        title: "CSRF Protection",
        desc: "Built-in security features including CSRF tokens and state validation to protect against attacks.",
        icon: Shield,
    },
    {
        title: "Type-Safe APIs",
        desc: "Full TypeScript support with end-to-end type inference for safe authentication development.",
        icon: Zap,
    },
]

export const Features = () => {
    return (
        <section>
            <SectionHeader
                title="Features"
                description="Explore the powerful features that make Aura Auth the ideal choice for modern authentication workflows."
            />
            <div className="grid divide-y divide-border md:grid-cols-2 md:divide-x lg:grid-cols-3">
                {features.map((feature) => (
                    <Link
                        key={feature.title}
                        href="/docs"
                        className="px-6 py-8 group md:nth-[3]:border-r-0 md:nth-[4]:border-b-0 md:nth-[5]:border-b-0"
                    >
                        <div className="mb-4">
                            <div className="size-10 flex items-center justify-center rounded-lg border-slate-500/30 bg-slate-500/20">
                                <feature.icon className="size-5" />
                            </div>
                        </div>
                        <h3 className="mb-2 text-sm font-semibold text-white">{feature.title}</h3>
                        <p className="mb-3 text-xs text-neutral-400 leading-relaxed">{feature.desc}</p>
                        <div className="inline-flex items-center gap-1 text-xs text-neutral-500 transition-colors group-hover:text-neutral-400">
                            Learn more <ArrowRight className="size-3" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
