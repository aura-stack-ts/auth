import { Fingerprint } from "lucide-react"
import { AuthClient } from "@/components/auth-client"
import { AuthServer } from "@/components/auth-server"

export default async function Home() {
    return (
        <main className="flex-1 bg-black">
            <section className="border-b border-muted">
                <div className="w-11/12 max-w-5xl mx-auto py-24 px-6 border-x border-muted space-y-8">
                    <div className="space-y-4 max-w-3xl">
                        <div className="px-3 py-1 inline-flex items-center gap-2 text-xs font-mono text-foreground rounded-full border border-muted">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Integration Example
                        </div>
                        <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-7xl">
                            Next.js Auth Powered by
                            <br />
                            <span className="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text">
                                Aura Auth Core
                            </span>
                        </h1>
                        <p className="max-w-xl text-lg text-foreground leading-relaxed">
                            This example demonstrates how to integrate Aura Auth Core into a Next.js application. It showcases
                            OAuth providers, server-side session management, and seamless client-server state synchronization.
                        </p>
                    </div>
                </div>
            </section>
            <section className="overflow-hidden">
                <div className="w-11/12 max-w-5xl mx-auto py-10 px-6 border-x border-b border-muted space-y-4">
                    <div className="flex items-center gap-3 text-foreground">
                        <Fingerprint className="h-4 w-4" />
                        <span className="text-white text-xs font-mono uppercase tracking-widest">Next.js Auth Integration</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                        This integration example is not representative of a production application. It demonstrates core
                        authentication flows and session management patterns for showcase purposes for client and server
                        components.
                    </p>
                </div>
                <div className="w-11/12 max-w-5xl mx-auto border-x border-muted grid grid-cols-1 md:grid-cols-2">
                    <AuthClient />
                    <AuthServer />
                </div>
            </section>
        </main>
    )
}
