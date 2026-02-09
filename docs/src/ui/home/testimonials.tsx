const testimonials = [
    {
        name: "Alex Rivera",
        role: "Senior Developer",
        company: "TechCorp",
        avatar: "AR",
        content:
            "Aura Auth saved us weeks of development time. The type-safe APIs and framework-agnostic design made integration seamless across our microservices.",
    },
    {
        name: "Sarah Chen",
        role: "Tech Lead",
        company: "StartupXYZ",
        avatar: "SC",
        content:
            "Finally, an auth library that doesn't lock you into a specific framework. We migrated from Next.js to Astro without touching our auth logic.",
    },
    {
        name: "Marcus Johnson",
        role: "Full Stack Engineer",
        company: "DevStudio",
        avatar: "MJ",
        content:
            "The security-first approach and built-in CSRF protection give us peace of mind. Plus, the TypeScript support is top-notch.",
    },
    {
        name: "Emily Watson",
        role: "CTO",
        company: "CloudScale",
        avatar: "EW",
        content:
            "We deployed Aura Auth on Cloudflare Workers and Vercel Edge without any issues. True framework-agnostic design.",
    },
    {
        name: "David Kim",
        role: "Backend Developer",
        company: "APIHub",
        avatar: "DK",
        content: "The OAuth 2.0 implementation is clean and well-documented. Adding new providers is straightforward.",
    },
    {
        name: "Lisa Martinez",
        role: "Product Engineer",
        company: "SaaSCo",
        avatar: "LM",
        content: "Aura Auth's session management is exactly what we needed. Encrypted by default, configurable, and performant.",
    },
]

export const Testimonials = () => {
    return (
        <section className="py-20 px-6 border-t border-white/10 bg-gradient-to-b from-purple-950/10 to-transparent">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">Hear From Our Community</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Developers around the world are building secure authentication with Aura Auth
                    </p>
                </div>
                <div className="relative">
                    <div className="overflow-x-auto pb-4 scrollbar-hide">
                        <div className="flex gap-6 min-w-max px-4">
                            {testimonials.map((testimonial) => (
                                <div
                                    key={testimonial.name}
                                    className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 w-[380px] flex-shrink-0"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="size-12 flex items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-400 text-white font-semibold">
                                            {testimonial.avatar}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold">{testimonial.name}</h4>
                                            <p className="text-sm text-white/60">
                                                {testimonial.role} at {testimonial.company}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-white/80 leading-relaxed">{testimonial.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
