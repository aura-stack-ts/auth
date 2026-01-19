import { Button } from "./ui/button"

export const Hero = () => {
    return (
        <section
            className="w-11/12 min-h-[calc(100dvh-6rem)] max-w-5xl mx-auto px-6 pt-20 flex flex-col items-center justify-center relative border md:pt-24"
            style={{ animation: "fadeIn 0.6s ease-out" }}
        >
            <h1
                className="text-4xl md:text-5xl lg:text-6xl font-medium text-center max-w-3xl px-6 leading-tight mb-6"
                style={{
                    background: "linear-gradient(to bottom, #ffffff, #ffffff, rgba(255, 255, 255, 0.6))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.05em",
                }}
            >
                The Modern Authentication for TanStack Start
            </h1>
            <p className="text-sm md:text-base text-center max-w-2xl px-6 mb-10" style={{ color: "#9ca3af" }}>
                Experience type-safe, unified state management and security with a developer-first approach. Build secure
                applications faster than ever.
            </p>
            <div className="flex items-center gap-4 relative z-10 mb-16">
                <Button size="lg" aria-label="Get started with the template">
                    Get started
                </Button>
                <Button variant="outline" size="lg" aria-label="Get started with the template">
                    GitHub
                </Button>
            </div>
            <span className="border-primary absolute -left-px -top-px block size-2 border-l-2 border-t-2" />
            <span className="border-primary absolute -bottom-px -right-px block size-2 border-b-2 border-r-2" />
        </section>
    )
}

Hero.displayName = "Hero"
