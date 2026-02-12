import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export const Hero = () => {
    return (
        <section className="mt-15 px-6 relative">
            <div className="min-h-[45dvw] max-w-6xl mx-auto py-18 px-6 flex items-center justify-center flex-col text-center border-x border-border">
                <div className="max-w-md relative z-10 lg:max-w-2xl">
                    <h1 className="text-white font-normal text-4xl -tracking-[1.5px] lg:text-5xl">
                        Ship OAuth 2.0. Secure by default. Authentication workflows made easy.
                    </h1>
                    <p className="mt-8 mb-12 text-white/80">
                        Create powerful authentication workflows with just a few lines of code. Ship OAuth 2.0, encrypted
                        sessions, and CSRF protection without rebuilding the plumbing.
                    </p>
                    <div className="flex flex-col justify-center items-center gap-5 xs:flex-row">
                        <Button className="w-full xs:w-fit" variant="secondary" size="lg" asChild>
                            <Link href="/docs">Get Started</Link>
                        </Button>
                        <Button className="w-full xs:w-fit" variant="secondary" size="lg" asChild>
                            <span>npm install @aura-stack/auth</span>
                        </Button>
                    </div>
                </div>
                <div className="size-full absolute left-0 top-0 pointer-events-none">
                    <Image
                        className="size-full"
                        src="/hero-gradient.png"
                        alt="Hero Gradient Background"
                        width={1200}
                        height={800}
                    />
                </div>
            </div>
        </section>
    )
}
