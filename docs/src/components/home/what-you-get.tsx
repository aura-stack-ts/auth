import Link from "next/link"
import { Lock, Code2, Shield, Cookie, Layers, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const useCases = [
    {
        title: "Framework-Agnostic",
        description:
            "Seamlessly integrate with any web framework or library. Build authentication flows that work with React, Vue, Svelte, and more.",
        icon: Globe,
        link: "/docs/concepts/framework-agnostic",
    },
    {
        title: "Runtime-Agnostic",
        description:
            "Run on any JavaScript runtime built on top of the Web Standard APIs (Request, Response, Fetch, Web Crypto).",
        icon: Layers,
        link: "/docs/concepts/runtime-agnosstic",
    },
    {
        title: "OAuth 2.0 & OpenID Connect",
        description:
            "First-class support for OAuth 2.0 and OpenID Connect. Implements PKCE, Authorization Code Flow for secure authentication.",
        icon: Lock,
        link: "/docs/concepts/oauth",
    },
    {
        title: "Type-first API",
        description:
            "First-class TypeScript support with complete type inference. Build authentication flows with confidence and catch errors at compile time.",
        icon: Code2,
        link: "/docs/concepts/typescript",
    },
    {
        title: "Secure by default",
        description:
            "Strong default practices for PKCE, state validation, secure cookies, redirect validation and CSRF validation.",
        icon: Shield,
        link: "/docs/concepts/security-model#token-management",
    },
    {
        title: "Composable",
        description:
            "Built from small, focused utilities and packages. Use only what you need (auth handlers, JOSE utilities and APIs).",
        icon: Cookie,
        link: "/docs/core-principles",
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
                                alt=""
                            />
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
