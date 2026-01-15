import { Form } from "react-router"
import { useSession } from "~/contexts/auth"
import { getSession as getSessionServer, signOut as signOutServer } from "~/actions/auth"
import { signOut as signOutClient } from "~/actions/auth.client"
import type { Route } from "./+types/client"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await getSessionServer(request)
    return session
}

export const action = async ({ request }: Route.ActionArgs) => {
    const nose = await signOutServer(request)
    return nose
}

const Client = () => {
    const { session, isAuthenticated } = useSession()

    const signOutAction = async () => {
        await signOutClient()
    }

    return (
        <section className="pt-8 p-6 relative border border-solid border-zinc-200 rounded-lg space-y-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <span className="py-0.5 px-2 text-xs absolute -top-3 left-0 rounded-full bg-blue-500">Client Side</span>
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
                <div className="border border-solid border-zinc-200 rounded-lg bg-white dark:border-zinc-800 dark:bg-zinc-900 p-6">
                    <h2 className="mb-4 text-lg font-semibold">Sign Out Options</h2>
                    <div className="flex flex-col gap-3">
                        <Form method="POST">
                            <button
                                className="w-full px-4 py-3 rounded-lg text-white font-medium transition-colors bg-red-600 hover:bg-red-700"
                                type="submit"
                            >
                                🔒 Secure Sign Out (with loaders)
                            </button>
                        </Form>
                        <form action={signOutAction} method="POST">
                            <button className="w-full px-4 py-3 border border-solid border-zinc-300 rounded-lg  transition-colors dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                                🔒 Secure Sign Out (with React Actions)
                            </button>
                        </form>
                        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                            The secure option uses CSRF token protection against cross-site request forgery attacks.
                        </p>
                    </div>
                </div>
            )}
        </section>
    )
}

export default Client
