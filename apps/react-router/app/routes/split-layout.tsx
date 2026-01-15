import { Outlet } from "react-router"
import { OAuthProviders } from "~/components/oauth-providers"
import { providers as providersList } from "~/lib/providers"
import type { Route } from "./+types/split-layout"

export const loader = async () => {
    const providers = providersList(process.env)
    return providers
}

const SplitLayout = ({ loaderData }: Route.ComponentProps) => {
    const providers = loaderData
    const configuredProviders = providers.filter((p) => p.configured)

    return (
        <main className="flex min-h-screen items-center justify-center font-sans bg-linear-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
            <section className="w-full min-h-screen max-w-5xl py-16 px-8 flex flex-col gap-8">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <img className="dark:invert" src="/favicon.ico" alt="React Router v7 logo" width={120} height={24} />
                        <span className="text-2xl font-bold">+</span>
                        <h1 className="text-2xl font-bold">Aura Auth</h1>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        Demonstration of Aura Auth authentication with OAuth 2.0 providers
                    </p>
                </div>
                <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    <section className="flex flex-col gap-6">
                        <Outlet />
                    </section>
                    <section className="flex flex-col gap-6">
                        <div className="border border-solid border-zinc-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
                            <h2 className="mb-4 text-lg font-semibold">Provider Configuration</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <p className="p-4 text-center rounded-lg bg-zinc-50 dark:bg-zinc-950">
                                    <span className="block text-3xl font-bold text-green-600">{configuredProviders.length}</span>
                                    <span className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Configured</span>
                                </p>
                                <p className="p-4 text-center rounded-lg bg-zinc-50 dark:bg-zinc-950">
                                    <span className="block text-3xl font-bold text-zinc-400">
                                        {providers.length - configuredProviders.length}
                                    </span>
                                    <span className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Not Configured</span>
                                </p>
                            </div>
                        </div>
                        <div className="border border-solid border-zinc-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
                            <h2 className="mb-4 text-lg font-semibold">Available OAuth Providers</h2>
                            <OAuthProviders providers={providers} isAuthenticated={false} />
                        </div>
                        <div className="border border-solid border-zinc-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
                            <h2 className="mb-4 text-lg font-semibold">Implementation Details</h2>
                            <div className="text-sm space-y-3 text-zinc-600 dark:text-zinc-400">
                                <div>
                                    <span className="text-zinc-900 dark:text-zinc-100">Authentication Flow:</span>
                                    <p>OAuth 2.0 authorization code flow with PKCE</p>
                                </div>
                                <div>
                                    <span className="text-zinc-900 dark:text-zinc-100">Session Management:</span>
                                    <p>Server-side session tokens with HTTP-only cookies</p>
                                </div>
                                <div>
                                    <span className="text-zinc-900 dark:text-zinc-100">CSRF Protection:</span>
                                    <p>Token-based validation for state-changing operations</p>
                                </div>
                                <div>
                                    <span className="text-zinc-900 dark:text-zinc-100">API Endpoints:</span>
                                    <ul className="ml-2 mt-1 list-disc list-inside">
                                        <li>/auth/signIn/:oauth</li>
                                        <li>/auth/signOut</li>
                                        <li>/auth/session</li>
                                        <li>/auth/csrfToken</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </section>
            </section>
        </main>
    )
}

export default SplitLayout
