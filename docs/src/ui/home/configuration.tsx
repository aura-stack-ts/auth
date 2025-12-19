import { SectionHeader } from "@/ui/home/section-header"

export const Configuration = () => {
    return (
        <section>
            <SectionHeader
                title="Configuration"
                description="Simple setup and flexible configuration for any authentication scenario. Configure OAuth providers, session handling, and security settings with minimal code."
            />
            <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-2 md:div:odd:border-r md:div:odd:border-border md:div:nth-[3]:border-b-0">
                <div className="px-6 py-8 transition-colors hover:bg-neutral-950/50 md:py-10">
                    <h4 className="mb-2 text-sm font-semibold text-white font-mono">basePath</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        Base path for all authentication routes and endpoints
                    </p>
                </div>
                <div className="px-6 py-8 transition-colors hover:bg-neutral-950/50 md:py-10">
                    <h4 className="mb-2 text-sm font-semibold text-white font-mono">oauth</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        Configure OAuth 2.0 providers and their credentials
                    </p>
                </div>
                <div className="px-6 py-8 transition-colors hover:bg-neutral-950/50 md:py-10">
                    <h4 className="mb-2 text-sm font-semibold text-white font-mono">cookies</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        Customize session cookie behavior, security, and settings
                    </p>
                </div>
                <div className="px-6 py-8 transition-colors hover:bg-neutral-950/50 md:py-10">
                    <h4 className="mb-2 text-sm font-semibold text-white font-mono">secret</h4>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                        Encryption key for secure session and token handling
                    </p>
                </div>
            </div>
        </section>
    )
}
