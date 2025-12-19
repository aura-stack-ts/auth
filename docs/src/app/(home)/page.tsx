import Link from "next/link"
import { ArrowRight, Github, Download, Users, Sparkles, Lock, Shield, Zap, Code2, Globe } from "lucide-react"
import {} from "fumadocs-ui/components/codeblock"

export default function HomePage() {
    return (
        <div className="min-h-screen bg-black text-white antialiased">
            <nav className="sticky top-0 z-50 border-b border-neutral-800 bg-black/80 backdrop-blur-xl">
                <div className="mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-mono text-sm">
                        <span className="text-neutral-400">&gt;_</span>
                        <span className="text-white font-medium">Aura Auth</span>
                    </div>
                    <Link
                        href="/docs"
                        className="px-4 py-2 text-sm font-medium text-white border border-neutral-800 rounded-lg transition-all duration-200"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>
            <section className="mt-10 px-20">
                <section className="px-3 py-24 md:px-6 md:py-32 lg:px-12 border-b border-x border-t border-neutral-800">
                    <div className="mx-auto">
                        <div className="flex justify-center mb-8">
                            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 border border-neutral-800 px-3.5 py-1.5">
                                <Sparkles className="h-3 w-3 text-neutral-400" />
                                <span className="text-xs font-medium text-neutral-300">New: Framework-Agnostic Auth Library</span>
                            </div>
                        </div>

                        <div className="text-center mb-16">
                            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-semibold mb-6 leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-300 via-purple-400 to-blue-500">
                                Aura Auth
                            </h1>
                            <p className="text-base md:text-lg lg:text-xl text-neutral-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                                Create powerful authentication workflows with just a few lines of code. Ship OAuth 2.0, encrypted
                                sessions, and CSRF protection without rebuilding the plumbing.
                            </p>
                            <div className="flex flex-col items-center gap-4">
                                <Link
                                    href="/docs"
                                    className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-black bg-white hover:bg-neutral-100 rounded-lg transition-all duration-200"
                                >
                                    Get Started
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                                <p className="text-xs text-neutral-500 font-mono">Available for all major JavaScript runtimes</p>
                            </div>
                        </div>
                    </div>
                </section>
            </section>
            <section className="px-20">
                <section className="border-b border-x border-neutral-800">
                    <div className="mx-auto">
                        <div className="px-6 py-16 text-left border-b border-neutral-800">
                            <h3 className="font-medium uppercase tracking-wider ">Configuration</h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Simple setup and flexible configuration for any authentication scenario. Configure OAuth
                                providers, session handling, and security settings with minimal code.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="px-6 py-8 md:py-10 border-r border-b border-neutral-800 hover:bg-neutral-950/50 transition-colors">
                                <h4 className="text-sm font-semibold text-white mb-2 font-mono">basePath</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Base path for all authentication routes and endpoints
                                </p>
                            </div>
                            <div className="px-6 py-8 md:py-10 border-b border-neutral-800 hover:bg-neutral-950/50 transition-colors">
                                <h4 className="text-sm font-semibold text-white mb-2 font-mono">oauth</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Configure OAuth 2.0 providers and their credentials
                                </p>
                            </div>
                            <div className="px-6 py-8 md:py-10 border-r border-neutral-800 hover:bg-neutral-950/50 transition-colors">
                                <h4 className="text-sm font-semibold text-white mb-2 font-mono">cookies</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Customize session cookie behavior, security, and settings
                                </p>
                            </div>
                            <div className="px-6 py-8 md:py-10 hover:bg-neutral-950/50 transition-colors">
                                <h4 className="text-sm font-semibold text-white mb-2 font-mono">secret</h4>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Encryption key for secure session and token handling
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <section className="px-20">
                <section className="border-b border-x border-neutral-800">
                    <div className="mx-auto">
                        <div className="px-6 text-left py-16 border-b border-neutral-800">
                            <h3 className="font-medium uppercase tracking-wider ">Why Aura Auth</h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                A type-safe authentication library for TypeScript. Ship OAuth 2.0, encrypted sessions, and CSRF
                                protection without rebuilding the plumbing.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3">
                            <div className="px-6 py-10 border-r border-neutral-800">
                                <h3 className="text-sm font-medium text-white mb-2">Secure by Default</h3>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Built-in protection against common vulnerabilities with encrypted sessions, hardened cookies,
                                    and CSRF defense out of the box.
                                </p>
                            </div>
                            <div className="px-6 py-10 border-r border-neutral-800">
                                <h3 className="text-sm font-medium text-white mb-2">Developer Experience</h3>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Intuitive APIs, comprehensive TypeScript support, and detailed documentation for rapid
                                    integration and deployment.
                                </p>
                            </div>
                            <div className="px-6 py-10 ">
                                <h3 className="text-sm font-medium text-white mb-2">Production Ready</h3>
                                <p className="text-xs text-neutral-400 leading-relaxed">
                                    Enterprise-grade authentication with proven reliability, performance at scale, and
                                    framework-agnostic design.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <section className="px-20">
                <section className="border-b border-x border-neutral-800">
                    <div className="mx-auto">
                        <div className="px-6 py-16 text-left border-b border-neutral-800">
                            <h3 className="font-medium uppercase tracking-wider ">Features</h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Explore the powerful features that make Aura Auth the ideal choice for modern authentication
                                workflows.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3">
                            {[
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
                            ].map((feature) => (
                                <Link key={feature.title} href="/docs" className="px-6 py-10 border border-neutral-800 group">
                                    <div className="mb-4">
                                        <div className="w-10 h-10 rounded-lg bg-slate-500/20 border border-slate-500/30 flex items-center justify-center">
                                            <feature.icon className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <h3 className="text-sm font-semibold text-white mb-2">{feature.title}</h3>
                                    <p className="text-xs text-neutral-400 mb-3 leading-relaxed">{feature.desc}</p>
                                    <div className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors inline-flex items-center gap-1">
                                        Learn more <ArrowRight className="h-3 w-3" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            </section>

            <section className="px-20">
                <section className="border-b border-x border-neutral-800">
                    <div className="mx-auto">
                        <div className="px-6 py-16 text-left border-b border-neutral-800">
                            <h3 className="font-medium uppercase tracking-wider ">Statistics</h3>
                            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Discover the innovative features that position Aura Auth as the top choice for contemporary
                                authentication solutions.
                            </p>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6 border border-neutral-800 rounded-lg divide-x divide-neutral-800">
                            {[
                                {
                                    icon: Github,
                                    value: "1+",
                                    label: "Stars on GitHub",
                                    link: "https://github.com/aura-stack-ts/auth",
                                },
                                {
                                    icon: Users,
                                    value: "1+",
                                    label: "Discord Members",
                                    link: "https://discord.gg/anXExMR5",
                                },
                                {
                                    icon: Download,
                                    value: "400+",
                                    label: "Downloads",
                                    link: "https://npmjs.com/package/@aura-stack/auth",
                                },
                            ].map((stat, idx) => (
                                <div
                                    key={stat.label}
                                    className={`p-8 text-center ${idx === 0 ? "rounded-l-lg" : ""} ${idx === 2 ? "rounded-r-lg" : ""}`}
                                >
                                    <a
                                        href={stat.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 mb-4"
                                    >
                                        <stat.icon className="h-6 w-6 text-neutral-500" />
                                        <span className="text-4xl font-semibold text-white tracking-tight">{stat.value}</span>
                                    </a>
                                    <p className="text-xs text-neutral-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </section>

            <section className="px-20">
                <section className="border-b border-x border-neutral-800">
                    <div className="mx-auto">
                        <div className="border border-neutral-800 p-12">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <h3 className="font-medium uppercase tracking-wider ">Join Our Community</h3>
                                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                                        Help us build the future of authentication. Contribute code, report issues, or share your
                                        ideas with our growing community of developers.
                                    </p>
                                    <Link
                                        href="https://github.com/aura-stack-ts/auth"
                                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-neutral-800 transition-all duration-200"
                                    >
                                        <Github className="h-4 w-4" />
                                        Become a contributor
                                    </Link>
                                </div>
                                <div className="flex items-center justify-center">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-14 w-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 font-medium text-lg nth-[2]:-ml-4 nth-[3]:-ml-5"
                                        >
                                            {["A", "U", "R"][i]}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </section>

            <footer className="mt-10 px-6 py-12 border-t border-neutral-800">
                <div className="mx-auto max-w-6xl">
                    <div className="grid md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-neutral-800">
                        <div>
                            <h3 className="font-semibold text-white mb-4">Aura Auth</h3>
                            <p className="text-sm text-neutral-400">Modern authentication for TypeScript applications.</p>
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-4">Documentation</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li>
                                    <Link href="/docs" className="hover:text-white transition">
                                        Overview
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/docs/quick-start" className="hover:text-white transition">
                                        Quick Start
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/docs/oauth" className="hover:text-white transition">
                                        OAuth Providers
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-4">Community</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li>
                                    <Link href="/docs/contributing" className="hover:text-white transition">
                                        Contributing
                                    </Link>
                                </li>
                                <li>
                                    <a href="https://github.com/aura-stack-ts/auth" className="hover:text-white transition">
                                        GitHub
                                    </a>
                                </li>
                                <li>
                                    <a href="https://x.com/aura_stack" className="hover:text-white transition">
                                        X (Twitter)
                                    </a>
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-white mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-neutral-400">
                                <li>
                                    <a
                                        href="https://www.npmjs.com/package/@aura-stack/auth"
                                        className="hover:text-white transition"
                                    >
                                        npm Package
                                    </a>
                                </li>
                                <li>
                                    <Link href="/docs/contributing" className="hover:text-white transition">
                                        API Reference
                                    </Link>
                                </li>
                                <li>
                                    <a
                                        href="https://github.com/aura-stack-ts/auth/issues"
                                        className="hover:text-white transition"
                                    >
                                        Issues
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <p className="text-sm text-neutral-500">© 2025 Aura Stack. All rights reserved.</p>
                        <div className="flex items-center gap-6 text-sm text-neutral-500 mt-6 md:mt-0">
                            <a href="https://github.com/aura-stack-ts/auth" className="hover:text-neutral-300 transition">
                                GitHub
                            </a>
                            <a href="https://x.com/aura_stack" className="hover:text-neutral-300 transition">
                                X
                            </a>
                            <a
                                href="https://www.npmjs.com/package/@aura-stack/auth"
                                className="hover:text-neutral-300 transition"
                            >
                                npm
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
