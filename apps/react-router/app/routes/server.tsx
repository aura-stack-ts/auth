import { Form, Link } from "react-router"
import { getSession, signOut } from "~/actions/auth"
import type { Route } from "./+types/server"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSession(request)
    return session
}

export const action = async ({ request }: Route.ActionArgs) => {
    return await signOut(request)
}

const Server = ({ loaderData }: Route.ComponentProps) => {
    const session = loaderData
    const isAuthenticated = !!session?.user

    return (
        <section className="pt-8 p-6 relative border border-solid border-zinc-200 rounded-lg space-y-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <span className="py-0.5 px-2 text-xs absolute -top-3 left-0 rounded-full bg-blue-500">Server Side</span>
            <div className="border border-solid border-zinc-200 rounded-lg relative dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
                <h2 className="mb-4 text-lg font-semibold">Session Status</h2>
                <div className="mb-4 flex items-center gap-2">
                    <div className={`size-3 rounded-full ${isAuthenticated ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-sm font-medium">{isAuthenticated ? "Authenticated" : "Not Authenticated"}</span>
                </div>
                {isAuthenticated && (
                    <div className="max-h-64 p-4 rounded overflow-auto bg-zinc-50 dark:bg-zinc-950">
                        <pre className="text-xs">{JSON.stringify(session, null, 2)}</pre>
                    </div>
                )}
                {!isAuthenticated && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Choose an OAuth provider below to sign in</p>
                )}
            </div>
            {isAuthenticated && (
                <div className="mt-4 border border-solid border-zinc-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Sign Out Options</h2>
                    <div className="flex flex-col gap-3">
                        <Form method="POST">
                            <button
                                className="w-full px-4 py-3 rounded-lg text-white font-medium transition-colors bg-red-600 hover:bg-red-700"
                                type="submit"
                            >
                                🔒 Secure Sign Out (with CSRF)
                            </button>
                        </Form>
                        <Form action="/auth/signOut?token_type_hint=session_token" method="POST">
                            <button className="w-full px-4 py-3 border border-solid border-zinc-300 rounded-lg  transition-colors dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                ⚠️ Sign Out (without CSRF)
                            </button>
                        </Form>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                            The secure option uses CSRF token protection against cross-site request forgery attacks.
                        </p>
                    </div>
                </div>
            )}
            <Link
                to="/client"
                className="inline-block w-full px-4 py-3 rounded-lg text-white font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-center"
            >
                Go to Client
            </Link>
        </section>
    )
}

export default Server
