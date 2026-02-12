import Link from "next/link"
import Image from "next/image"
import { Github, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export const FinalCTA = () => {
    return (
        <section className="px-6 relative border-t border-border">
            <div className="max-w-6xl mx-auto py-30 px-6 text-center relative z-10 border-x border-border">
                <div className="max-w-md mx-auto relative z-10 lg:max-w-2xl">
                    <h2 className="text-white font-normal text-4xl -tracking-[1.5px] lg:text-5xl">
                        Ready to Ship Authentication 10x Faster?
                    </h2>
                    <p className="mt-8 mb-12 text-white/80">
                        Join developers building secure, production-ready auth with Aura Auth. Get started in minutes, not days.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button variant="secondary" size="lg" asChild>
                        <Link href="/docs">
                            Get Started
                            <ArrowRight className="size-5" />
                        </Link>
                    </Button>
                    <Button variant="secondary" size="lg" asChild>
                        <Link href="https://github.com/aura-stack-ts/auth" target="_blank">
                            <Github className="size-5" />
                            View on GitHub
                        </Link>
                    </Button>
                </div>
            </div>
            <div className="size-full absolute left-0 top-0 pointer-events-none">
                <Image className="size-full" src="/hero-gradient.png" alt="Hero Gradient Background" width={1200} height={800} />
            </div>
        </section>
    )
}
