import Link from "next/link"
import { Button } from "./ui/button"
import Image from "next/image"

export const Hero = () => {
    return (
        <section className="mt-20">
            <section className="px-6 relative">
                <div className="min-h-[40dvw] px-6 max-w-6xl mx-auto flex items-center justify-center flex-col text-center border-x border-white/20">
                    <div className="max-w-md lg:max-w-2xl">
                        <h1 className="font-normal text-4xl -tracking-[1.5px] lg:text-5xl">
                            Ship OAuth 2.0. Secure by default. Authentication workflows made easy.
                        </h1>
                        <p className="mt-8 mb-12 text-white/80">
                            Create powerful authentication workflows with just a few lines of code. Ship OAuth 2.0, encrypted
                            sessions, and CSRF protection without rebuilding the plumbing.
                        </p>
                        <div className="flex justify-center items-center gap-x-5">
                            <Button className="relative z-10 border-black bg-black" variant="outline" size="lg" asChild>
                                <Link href="/docs">Get Started</Link>
                            </Button>
                            <Button
                                className="relative z-10 text-white border-black bg-black"
                                variant="outline"
                                size="lg"
                                asChild
                            >
                                <span>npm install @aura-stack/auth</span>
                            </Button>
                        </div>
                    </div>
                    {/* <div className="flex flex-col items-end absolute -right-60 -top-10 blur-xl z-0 ">
                        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-purple-600 to-sky-600"></div>
                        <div className="h-[10rem] rounded-full w-[90rem] z-1 bg-gradient-to-b blur-[6rem] from-pink-900 to-yellow-400"></div>
                        <div className="h-[10rem] rounded-full w-[60rem] z-1 bg-gradient-to-b blur-[6rem] from-yellow-600 to-sky-500"></div>
                    </div>
                    <div className="absolute inset-0 z-0 bg-noise opacity-30"></div> */}
                    <div className="absolute left-0 top-0 pointer-events-none w-full h-full">
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
            <section className="py-24 border-y border-white/20">
                <h2 className="text-center">Trusted by</h2>
                <div className="mt-8 flex items-center justify-center gap-x-8 overflow-hidden">
                    <span className="w-0 min-w-fit">Vercel</span>
                    <span className="w-0 min-w-fit">Cloudflare</span>
                    <span className="w-0 min-w-fit">Netlify</span>
                    <span className="w-0 min-w-fit">Supabase</span>
                    <span className="w-0 min-w-fit">Fly.io</span>
                    <span className="w-0 min-w-fit">Render</span>
                </div>
            </section>
        </section>
    )
}
