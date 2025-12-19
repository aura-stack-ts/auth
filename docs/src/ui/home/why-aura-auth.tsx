import { SectionHeader } from "@/ui/home/section-header"

export const WhyAuraAuth = () => {
    return (
        <section>
            <SectionHeader
                title="Why Aura Auth"
                description="A type-safe authentication library for TypeScript. Ship OAuth 2.0, encrypted sessions, and CSRF protection without rebuilding the plumbing."
            />
            <div className="grid md:grid-cols-3">
                <div className="px-6 py-8 border-b border-border md:border-r md:border-b-0 hover:bg-primary-foreground/10 ">
                    <h3 className="mb-2 text-lg font-medium text-primary">Secure by Default</h3>
                    <p className="text-base text-primary-foreground leading-relaxed">
                        Built-in protection against common vulnerabilities with encrypted sessions, hardened cookies, and CSRF
                        defense out of the box.
                    </p>
                </div>
                <div className="px-6 py-8 border-b border-border md:border-r md:border-b-0 hover:bg-primary-foreground/10">
                    <h3 className="mb-2 text-lg font-medium text-primary">Developer Experience</h3>
                    <p className="text-base text-primary-foreground leading-relaxed">
                        Intuitive APIs, comprehensive TypeScript support, and detailed documentation for rapid integration and
                        deployment.
                    </p>
                </div>
                <div className="px-6 py-8 hover:bg-primary-foreground/10">
                    <h3 className="mb-2 text-lg font-medium text-primary">Production Ready</h3>
                    <p className="text-base text-primary-foreground leading-relaxed">
                        Enterprise-grade authentication with proven reliability, performance at scale, and framework-agnostic
                        design.
                    </p>
                </div>
            </div>
        </section>
    )
}
