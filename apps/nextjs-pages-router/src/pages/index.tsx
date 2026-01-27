import { Geist, Geist_Mono } from "next/font/google"
import { Fingerprint, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
})

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
})

export default function Home() {
    const session = {
        user: {
            name: "John Doe",
            email: "",
            sub: "1234567890",
            image: "",
        },
    }
    const providers = [] as any[]
    const isAuthenticated = false

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
                <div className="w-11/12 max-w-5xl mx-auto border-x border-muted grid grid-cols-1 md:grid-cols-2">
                    <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-muted space-y-12 bg-white/1">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-foreground">
                                <Fingerprint className="h-4 w-4" />
                                <span className="text-white text-xs font-mono uppercase tracking-widest">
                                    NextAuth Integration
                                </span>
                            </div>
                            <p className="text-sm text-white/40 leading-relaxed">
                                This integration example is not representative of a production application. It demonstrates core
                                authentication flows and session management patterns for showcase purposes.
                            </p>
                        </div>
                    </div>
                    <div className="p-8 flex items-center justify-center bg-black md:p-12">
                        <div className="w-full max-w-sm space-y-6">
                            {isAuthenticated ? (
                                <>
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="py-3 px-2 border border-muted rounded-md space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-mono italic">server session active</span>
                                                <LayoutDashboard className="size-4 text-foreground" />
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 rounded-full bg-linear-to-b from-white to-white/40 p-px">
                                                    <div className="h-full w-full rounded-full bg-black flex items-center justify-center text-xl font-bold">
                                                        {session?.user?.name?.[0] || "?"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-lg font-medium text-white">{session?.user?.name}</p>
                                                    <p className="text-xs text-white/40 font-mono">{session?.user?.email}</p>
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-muted">
                                                <div className="flex justify-between items-center text-[10px] font-mono">
                                                    <span className="text-white/20 uppercase">ID</span>
                                                    <span className="text-white/60 truncate max-w-37.5">
                                                        {session?.user?.sub}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4 text-center">
                                        <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
                                        <p className="text-sm text-white/40">
                                            Choose a provider below to authenticate and start your session.
                                        </p>
                                        <div className="flex flex-col gap-y-2">
                                            {providers.map((provider) => (
                                                <form className="w-full" key={provider.id}>
                                                    <Button className="w-full" variant="outline" size="sm" key={provider.id}>
                                                        Sign In with {provider.name}
                                                    </Button>
                                                </form>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
