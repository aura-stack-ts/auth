const testimonials = [
    {
        name: "Alex Rivera",
        role: "Senior Developer",
        avatar: "AR",
        content:
            "Aura Auth saved us weeks of development time. The type-safe APIs and framework-agnostic design made integration seamless across our microservices.",
    },
    {
        name: "Sarah Chen",
        role: "Tech Lead",
        avatar: "SC",
        content:
            "Finally, an auth library that doesn't lock you into a specific framework. We migrated from Next.js to Astro without touching our auth logic.",
    },
    {
        name: "Marcus Johnson",
        role: "Full Stack Engineer",
        avatar: "MJ",
        content:
            "The security-first approach and built-in CSRF protection give us peace of mind. Plus, the TypeScript support is top-notch.",
    },
    {
        name: "Emily Watson",
        role: "CTO",
        avatar: "EW",
        content:
            "We deployed Aura Auth on Cloudflare Workers and Vercel Edge without any issues. True framework-agnostic design.",
    },
    {
        name: "David Kim",
        role: "Backend Developer",
        avatar: "DK",
        content: "The OAuth 2.0 implementation is clean and well-documented. Adding new providers is straightforward.",
    },
    {
        name: "Lisa Martinez",
        role: "Product Engineer",
        avatar: "LM",
        content: "Aura Auth's session management is exactly what we needed. Encrypted by default, configurable, and performant.",
    },
]

export const Testimonials = () => {
    return (
        <section className="px-6 border-t border-border">
            <div className="max-w-6xl mx-auto py-20 px-6 border-x border-border">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4 text-white md:text-5xl">Hear From Our Community</h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Developers around the world are building secure authentication with Aura Auth
                    </p>
                </div>
                <div className="pb-4 overflow-x-auto relative">
                    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
                        {testimonials.map((testimonial) => (
                            <div
                                key={testimonial.name}
                                className="w-full shrink-0 p-6 border border-border transition-all duration-300 bg-background hover:bg-white/5"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-12 flex items-center justify-center rounded-full text-white font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <h4 className="text-white font-semibold">{testimonial.name}</h4>
                                </div>
                                <p className="text-white/80 leading-relaxed">{testimonial.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
