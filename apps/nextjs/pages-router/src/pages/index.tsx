import { api } from "@/lib/auth"
import { AuthClient } from "@/components/auth-client"
import { Fingerprint, LayoutDashboard } from "lucide-react"
import type { InferGetServerSidePropsType } from "next"
import type { IncomingMessage } from "http"

export const getServerSideProps = async ({ req }: { req: IncomingMessage }) => {
    const session = await api.getSession({
        headers: req.headers as Record<string, string>,
    })
    return {
        props: {
            session: session.authenticated ? session.session : null,
        },
    }
}

export default function Home({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const isAuthenticated = session?.user !== undefined

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
                            Next.js Pages Router Auth Powered by
                            <br />
                            <span className="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text">
                                Aura Auth Core
                            </span>
                        </h1>
                        <p className="max-w-xl text-lg text-foreground leading-relaxed">
                            This example demonstrates how to integrate Aura Auth Core into a Next.js Pages Router application. It
                            showcases OAuth providers, server-side session management, and seamless client-server state
                            synchronization.
                        </p>
                    </div>
                </div>
            </section>
            <section className="overflow-hidden box-auth" data-auth={isAuthenticated}>
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
                    {isAuthenticated && (
                        <div className="size-full p-6 bg-black md:pl-3 md:py-10">
                            <div className="size-full p-6 relative space-y-6 border border-muted border-dashed">
                                <span className="px-2 text-xs font-mono italic absolute -top-2 left-3 bg-blue-500">
                                    Server Component
                                </span>
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="py-3 px-2 border border-muted rounded-md space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono italic">server session active</span>
                                            <LayoutDashboard className="size-4 text-foreground" />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="size-14 rounded-full bg-linear-to-b from-white to-white/40 p-px">
                                                <div className="h-full w-full rounded-full aspect-square bg-black flex items-center justify-center text-xl font-bold">
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
                                                <span className="text-white/60 truncate max-w-37.5">{session?.user?.sub}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}
