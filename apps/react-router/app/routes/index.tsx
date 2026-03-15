import { Form } from "react-router"
import { Button } from "~/components/ui/button"
import { AuthClient } from "~/components/auth-client"
import { Fingerprint, LayoutDashboard } from "lucide-react"
import { getSession, signIn } from "~/actions/auth-server"
import type { Route } from "./+types/index"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request)
    return { session }
}

//export const action = async ({ request }: Route.ActionArgs) => {
//    await signOut(request)
//}

const IndexPage = ({ loaderData }: Route.ComponentProps) => {
    const { session } = loaderData
    const isAuthenticated = Boolean(session && session?.user)

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
                            React Router Powered by
                            <br />
                            <span className="text-transparent italic font-serif bg-linear-to-r from-white via-white/80 to-white/40 bg-clip-text">
                                Aura Auth Core
                            </span>
                        </h1>
                        <p className="max-w-xl text-lg text-foreground leading-relaxed">
                            This example demonstrates how to integrate Aura Auth Core into a React Router application. It
                            showcases OAuth providers, server-side session management, and seamless client-server state
                            synchronization.
                        </p>
                    </div>
                </div>
            </section>
            <section className="overflow-hidden">
                <div className="w-11/12 max-w-5xl mx-auto py-10 px-6 border-x border-b border-muted space-y-4">
                    <div className="flex items-center gap-3 text-foreground">
                        <Fingerprint className="h-4 w-4" />
                        <span className="text-white text-xs font-mono uppercase tracking-widest">React Router Integration</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed">
                        This integration example is not representative of a production application. It demonstrates core
                        authentication flows and session management patterns for showcase purposes.
                    </p>
                </div>
                <div className="w-11/12 max-w-5xl mx-auto border-x border-muted grid grid-cols-1 md:grid-cols-2">
                    <AuthClient />
                    <div className="w-full p-6 pr-3 bg-black md:py-10">
                        <div className="w-full p-6 relative space-y-6 border border-muted border-dashed">
                            <span className="px-2 text-xs font-mono italic absolute -top-2 left-3 bg-blue-600">
                                Server Component
                            </span>
                            {isAuthenticated ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="py-3 px-2 border border-muted rounded-md space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-mono italic">client session active</span>
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
                                        <Form method="post">
                                            <Button type="button" variant="outline" size="sm">
                                                Sign Out
                                            </Button>
                                        </Form>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="space-y-4 text-center">
                                        <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
                                        <p className="text-sm text-white/40">
                                            Choose a provider below to authenticate and start your session.
                                        </p>
                                        <div className="flex flex-col gap-y-2">
                                            {["Github", "Gitlab", "Bitbucket"].map((provider) => (
                                                <div className="w-full" key={provider}>
                                                    <Button
                                                        type="button"
                                                        className="w-full rounded-none"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => signIn(provider.toLowerCase())}
                                                    >
                                                        Sign In with {provider}
                                                    </Button>
                                                </div>
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

export default IndexPage
