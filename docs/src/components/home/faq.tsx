"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqs = [
    {
        question: "What is Aura Auth?",
        answer: "Aura Auth is a framework-agnostic, type-safe authentication library for TypeScript. It provides OAuth 2.0 support, session management, and security features like CSRF protection, all built on web standards.",
    },
    {
        question: "Which frameworks does Aura Auth support?",
        answer: "Aura Auth works with any JavaScript runtime that supports the Web Request/Response API. This includes Next.js, Astro, TanStack Start, SvelteKit, Remix, Express, and more. It can also run on edge runtimes like Cloudflare Workers and Vercel Edge.",
    },
    {
        question: "Is Aura Auth secure?",
        answer: "Yes. Aura Auth is built with security as a top priority. It includes encrypted JWT sessions, CSRF protection, secure cookie handling with proper flags, and follows OAuth 2.0 best practices. All sessions are encrypted by default.",
    },
    {
        question: "Can I use Aura Auth in production?",
        answer: "Absolutely. Aura Auth is production-ready and designed for enterprise-grade applications. It's been thoroughly tested and follows security best practices for authentication workflows.",
    },
    {
        question: "What OAuth providers are supported?",
        answer: "Aura Auth supports multiple OAuth providers including GitHub, Discord, Google, Figma, and more. You can also easily add custom OAuth 2.0 providers using the extensible provider system.",
    },
    {
        question: "How does Aura Auth compare to Auth.js?",
        answer: "Aura Auth is inspired by Auth.js but focuses on being truly framework-agnostic by using web standards (Request/Response API). It's built with TypeScript-first design, provides stronger type safety, and has a simpler, more composable API.",
    },
]

export const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    return (
        <section className="px-6 border-t border-border">
            <div className="mx-auto max-w-6xl py-20 px-6 border-x border-border">
                <div className=" mx-auto lg:grid grid-cols-2">
                    <div className="max-w-md text-center mb-16 lg:text-start">
                        <h2 className="text-3xl font-bold mb-4 text-white md:text-4xl">Frequently Asked Questions</h2>
                        <p className="text-lg text-white/70 max-w-2xl mx-auto">Everything you need to know about Aura Auth</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border-b border-border bg-background overflow-hidden transition-all duration-300"
                            >
                                <button
                                    onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                    className="w-full py-5 flex items-center justify-between text-left"
                                >
                                    <h3 className="text-lg font-semibold text-white pr-8">{faq.question}</h3>
                                    <ChevronDown
                                        className={cn("size-5 text-white/70 shrink-0 transition-transform duration-300", {
                                            "rotate-180": openIndex === index,
                                        })}
                                    />
                                </button>
                                <div
                                    className={cn("overflow-hidden transition-all duration-300", {
                                        "max-h-96": openIndex === index,
                                        "max-h-0": openIndex !== index,
                                    })}
                                >
                                    <div className="pb-5">
                                        <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
