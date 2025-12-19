import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export const Hero = () => {
    return (
        <section className="mx-auto px-6 py-24 md:px-6 md:py-32 lg:px-12">
            <div className="mb-8 flex justify-center">
                <div className="py-1.5 px-3.5 inline-flex items-center gap-2 border border-border rounded-full bg-neutral-900">
                    <Sparkles className="size-3 text-neutral-400" />
                    <span className="text-xs font-medium text-neutral-300">New: Framework-Agnostic Auth Library</span>
                </div>
            </div>
            <div className="mb-16 text-center">
                <h1 className="mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-linear-to-r from-emerald-300 via-purple-400 to-blue-500 md:text-6xl lg:text-7xl xl:text-8xl">
                    Aura Auth
                </h1>
                <p className="max-w-2xl mb-10 mx-auto text-base text-neutral-400 leading-relaxed md:text-lg lg:text-xl">
                    Create powerful authentication workflows with just a few lines of code. Ship OAuth 2.0, encrypted sessions,
                    and CSRF protection without rebuilding the plumbing.
                </p>
                <div className="flex flex-col items-center gap-4">
                    <Link
                        href="/docs"
                        className="px-6 py-3 inline-flex items-center gap-2 text-sm font-medium text-black rounded-lg transition-all duration-200 bg-white hover:bg-neutral-100"
                    >
                        Get Started
                        <ArrowRight className="size-4" />
                    </Link>
                    <p className="text-xs text-neutral-500 font-mono">Available for all major JavaScript runtimes</p>
                </div>
            </div>
        </section>
    )
}
