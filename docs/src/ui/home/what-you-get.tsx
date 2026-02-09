import { Code2, Globe, Lock, Shield, Zap, Cookie } from "lucide-react"

const features = [
    {
        title: "OAuth 2.0 Support",
        desc: "Native support for multiple OAuth providers including GitHub, Discord, Google, and more. Implement social login in minutes.",
        icon: Lock,
    },
    {
        title: "Type-Safe APIs",
        desc: "Full TypeScript support with end-to-end type inference. Catch errors at compile time, not runtime.",
        icon: Code2,
    },
    {
        title: "Secure Sessions",
        desc: "Built-in JWT-based session management with encryption and signing. Sessions are secure by default.",
        icon: Shield,
    },
    {
        title: "Framework Agnostic",
        desc: "Works with any JavaScript runtime that supports the Web Request/Response API. One library, any framework.",
        icon: Globe,
    },
    {
        title: "CSRF Protection",
        desc: "Built-in security features including CSRF tokens and state validation to protect against common attacks.",
        icon: Shield,
    },
    {
        title: "Cookie Handling",
        desc: "Secure, configurable cookies for session persistence with proper security flags and domain settings.",
        icon: Cookie,
    },
]

export const WhatYouGet = () => {
    return (
        <section className="px-6">
            <div className="max-w-6xl py-20 mx-auto border-x border-white/20">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">What You Get</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Everything you need to build secure, production-ready authentication workflows
                    </p>
                </div>
                <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex gap-6 min-w-max px-4">
                            {features.map((feature) => (
                                <div
                                    key={feature.title}
                                    className="group p-6 border border-white/10 bg-black transition-all duration-300 w-[320px] flex-shrink-0"
                                >
                                    <div className="mb-4">
                                        <div className="size-12 flex items-center justify-center rounded-lg">
                                            <feature.icon className="size-8 text-white" />
                                        </div>
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold text-white">{feature.title}</h3>
                                    <p className="text-base text-white/70 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
