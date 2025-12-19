"use client"
import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ArrowRightIcon, Copy, Check } from "lucide-react"
import { AnimatedShinyText } from "@/ui/shiny-text"
import { Meteors } from "@/ui/meteors"

export const Hero = () => {
    const [copied, setCopied] = useState(false)

    const copyToClipboard = async () => {
        await navigator.clipboard.writeText("npm i @aura-stack/auth")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <section className="mx-auto px-6 py-24 relative overflow-hidden md:px-6 md:py-32 lg:px-12">
            <Meteors number={50} />
            <div className="w-fit mx-auto group rounded-full border border-black/5 text-base text-white transition-all ease-in bg-neutral-100 hover:cursor-pointer hover:bg-neutral-200 dark:border-white/5 dark:bg-neutral-900 dark:hover:bg-neutral-800">
                <AnimatedShinyText className="px-4 py-1 inline-flex items-center justify-center transition ease-out hover:text-primary-foreground hover:duration-300 hover:dark:text-neutral-400">
                    <span className="text-center">
                        ✨ New: <span className="hidden sm:inline">Framework-Agnostic</span> Auth Library
                    </span>
                    <ArrowRightIcon className="hidden size-3 ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5 sm:inline" />
                </AnimatedShinyText>
            </div>
            <div className="mt-8 mb-16 text-center">
                <h1 className="w-fit mx-auto mb-6 text-5xl font-semibold leading-[1.1] tracking-tight text-transparent bg-clip-text bg-linear-to-r from-purple-600 via-emerald-500 to-blue-400 md:text-6xl lg:text-7xl xl:text-8xl">
                    Aura Auth
                </h1>
                <p className="max-w-2xl mb-10 mx-auto text-base text-primary-foreground leading-relaxed md:text-lg lg:text-xl">
                    Create powerful authentication workflows with just a few lines of code. Ship OAuth 2.0, encrypted sessions,
                    and CSRF protection without rebuilding the plumbing.
                </p>
                <div className="flex flex-col items-center gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <Link
                            href="/docs"
                            className="px-6 py-3 inline-flex items-center gap-2 text-sm font-medium text-black rounded-lg transition-all duration-200 bg-white hover:bg-neutral-100"
                        >
                            Get Started
                            <ArrowRight className="size-4" />
                        </Link>
                        <button
                            onClick={copyToClipboard}
                            className="px-4 py-3 inline-flex items-center gap-2 text-sm font-mono text-primary border border-border rounded-lg transition-all duration-200 hover:bg-border"
                        >
                            <span className="text-neutral-500">$</span>
                            npm i @aura-stack/auth
                            {copied ? (
                                <Check className="size-4 text-green-400" />
                            ) : (
                                <Copy className="size-4 text-neutral-500 hover:cursor-pointer" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono">Available for all major JavaScript runtimes</p>
                </div>
            </div>
        </section>
    )
}
