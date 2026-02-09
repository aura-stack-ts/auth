import Link from "next/link"
import { Github, ArrowRight } from "lucide-react"
import { Ripple } from "@/ui/ripple"

export const FinalCTA = () => {
    return (
        <section className="w-full relative flex flex-col items-center justify-center overflow-hidden border-t border-white/10">
            <Ripple />
            <div className="max-w-6xl mx-auto py-30 px-6 text-center relative z-10 border-x border-white/20">
                <h2 className="text-5xl font-bold mb-6 text-white md:text-6xl lg:text-7xl">
                    Ready to Ship Authentication 10x Faster?
                </h2>
                <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
                    Join developers building secure, production-ready auth with Aura Auth. Get started in minutes, not days.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link
                        href="/docs"
                        className="px-8 py-4 inline-flex items-center gap-2 text-base font-medium text-black rounded-lg transition-all duration-200 bg-white hover:bg-neutral-100"
                    >
                        Get Started
                        <ArrowRight className="size-5" />
                    </Link>
                    <Link
                        href="https://github.com/aura-stack-ts/auth"
                        className="px-8 py-4 inline-flex items-center gap-2 text-base font-medium text-white rounded-lg border border-white/20 transition-all duration-200 hover:bg-white/10"
                    >
                        <Github className="size-5" />
                        View on GitHub
                    </Link>
                </div>
            </div>
        </section>
    )
}
