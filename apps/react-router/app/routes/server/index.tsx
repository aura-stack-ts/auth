import { Form, Link, useSubmit } from "react-router"
import { api } from "~/lib/auth"
import { Button } from "~/components/ui/button"
import { EditProfile } from "~/components/edit-profile"
import type { SubmitEvent } from "react"
import type { Route } from "./+types/index"
import type { Session } from "@aura-stack/react-router"

export const loader = async ({ request }: Route.LoaderArgs) => {
    const session = await api.getSession({
        headers: request.headers,
    })

    return { session: session as Session | null }
}

export const action = async ({ request }: Route.ActionArgs) => {
    const formData = await request.formData()
    const actionType = formData.get("action")

    if (actionType === "signOut") {
        return await api.signOut({
            request,
            redirectTo: "/server",
        })
    }

    if (actionType === "signIn") {
        const provider = formData.get("provider") as string
        return await api.signIn(provider, { request })
    }

    if (actionType === "signInCredentials") {
        const username = formData.get("username") as string
        const password = formData.get("password") as string

        await api.signInCredentials({
            payload: {
                username,
                password,
            },
            request,
        })
    }

    if (actionType === "updateSession") {
        const value = await api.updateSession({
            user: {
                name: formData.get("username") ? (formData.get("username") as string) : undefined,
                email: formData.get("email") ? (formData.get("email") as string) : undefined,
            },
        })
        return value.toResponse()
    }

    return null
}

const AuthServerPage = ({ loaderData }: Route.ComponentProps) => {
    const { session } = loaderData
    const submit = useSubmit()
    const isAuthenticated = Boolean(session && session.user)

    const handleSignInCredentials = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        submit(event.currentTarget, { method: "post" })
    }

    const handleUpdateSession = async (formData: FormData) => {
        formData.set("action", "updateSession")
        submit(formData, { method: "post" })
    }

    return (
        <main className="w-11/12 min-h-container max-w-5xl mx-auto content-center">
            <section className="max-w-lg mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white">Aura Auth + React Router Server Components</h1>
                    <p className="mt-2 text-base text-white/70 max-w-3xl">
                        Official React Router demo to showcase @aura-stack/react-router authentication library with server loaders
                        and actions for Server Side Rendering (SSR), for Client-Side Rendering (CSR) visit{" "}
                        <Link className="text-white underline underline-offset-2" to="/client">
                            here
                        </Link>
                    </p>
                </div>
            </section>
            <section className="mt-8 max-w-lg mx-auto border bg-black">
                {isAuthenticated ? (
                    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {session?.user?.image ? (
                            <img
                                className="rounded-full"
                                src={session.user.image}
                                alt={session.user?.name ?? "User Avatar"}
                                width={56}
                                height={56}
                            />
                        ) : (
                            <span className="size-14 block rounded-full ring-2 ring-white/40">
                                <span className="h-full w-full p-0.5 aspect-square text-xl font-bold flex items-center justify-center rounded-full bg-black">
                                    {session?.user?.name?.[0] || "?"}
                                </span>
                            </span>
                        )}
                        <div className="flex items-center justify-between">
                            <div className="mt-2">
                                <p className="text-lg font-medium text-white">{session?.user?.name}</p>
                                <p className="text-xs text-white/40 font-mono">{session?.user?.email}</p>
                            </div>
                        </div>
                        <EditProfile action={handleUpdateSession} />
                        <Form className="my-4 pt-4 flex items-center justify-between gap-x-4 border-t" method="post">
                            <input type="hidden" name="action" value="signOut" />
                            <div>
                                <label className="font-medium block" htmlFor="signout">
                                    Sign Out of the device
                                </label>
                                <span className="text-sm">Sign out of the device with active session</span>
                            </div>
                            <Button className="w-20" variant="default">
                                Sign Out
                            </Button>
                        </Form>
                        <span className="w-full h-px block bg-white/40" />
                        <span className="mt-4 block text-center text-white/40">
                            Built with{" "}
                            <a
                                className="text-white underline underline-offset-2"
                                href="https://aura-stack-auth.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @aura-stack/auth
                            </a>
                        </span>
                    </div>
                ) : (
                    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-white">Sign in to continue</h2>
                            <p className="mt-3 mb-6 text-sm text-white/40">
                                Sign in with your GitHub, Gitlab or Bitbucket account.
                            </p>
                            <div className="flex flex-col gap-y-2">
                                {["Github", "Gitlab", "Bitbucket"].map((provider) => (
                                    <Form className="w-full" method="post" key={provider}>
                                        <input type="hidden" name="provider" value={provider.toLowerCase()} />
                                        <Button className="w-full rounded-none" variant="outline" name="action" value="signIn">
                                            Sign In with {provider}
                                        </Button>
                                    </Form>
                                ))}
                            </div>
                            <p className="my-5 relative">
                                <span className="w-full h-px block absolute top-1/2 bg-white/40" />
                                <span className="px-2 relative z-10 bg-black">Or continue with</span>
                            </p>
                            <Form className="w-full text-start" method="post" onSubmit={handleSignInCredentials}>
                                <input type="hidden" name="action" value="signInCredentials" />
                                <div>
                                    <label className="font-medium block" htmlFor="username">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                                    />
                                </div>
                                <div className="mt-4">
                                    <label className="font-medium block" htmlFor="password">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                                    />
                                </div>
                                <Button className="w-full mt-6" variant="default">
                                    Sign In
                                </Button>
                            </Form>
                        </div>
                        <span className="w-full h-px block bg-white/40" />
                        <span className="block text-center text-white/40">
                            Built with{" "}
                            <a
                                className="text-white underline underline-offset-2"
                                href="https://aura-stack-auth.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @aura-stack/auth
                            </a>
                        </span>
                    </div>
                )}
            </section>
        </main>
    )
}

export default AuthServerPage
