import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@aura-stack/next/client"
import { EditProfile } from "@/components/edit-profile"
import type { SubmitEvent } from "react"

export default function AuthClientPage() {
    const { session, status, isPending, signIn, signOut, signInCredentials, updateSession } = useAuth()
    const isAuthenticated = status === "authenticated"

    const handleSignInCredentials = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault()
        const formData = new FormData(event.currentTarget)
        const username = formData.get("username") as string
        const password = formData.get("password") as string

        await signInCredentials({
            payload: {
                username,
                password,
            },
            redirectTo: "/client",
        })
    }

    const handleUpdateSession = async (formData: FormData) => {
        await updateSession({
            session: {
                user: {
                    name: formData.get("username") ? (formData.get("username") as string) : undefined,
                    email: formData.get("email") ? (formData.get("email") as string) : undefined,
                },
            },
            redirectTo: "/client",
        })
    }

    const handleSignOut = async () => {
        await signOut({ redirectTo: "/client" })
    }

    return (
        <main className="w-11/12 min-h-container max-w-5xl mx-auto content-center">
            <section className="max-w-lg mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white">Aura Auth + Next.js Client Components</h1>
                    <p className="mt-2 text-base text-white/70 max-w-3xl">
                        Official Next.js demo to showcase @aura-stack/next authentication library with Client Side Rendering
                        (CSR), for Server-Side Rendering (SSR) visit{" "}
                        <Link className="text-white underline underline-offset-2" href="/server">
                            here
                        </Link>
                    </p>
                </div>
            </section>
            <section className="mt-8 max-w-lg mx-auto border bg-black">
                {isAuthenticated ? (
                    <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {session?.user?.image ? (
                            <Image
                                className="rounded-full"
                                src={session.user.image}
                                alt={`User image ${session.user?.name}`}
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
                        <form className="my-4 pt-4 flex items-center justify-between gap-x-4 border-t">
                            <div>
                                <label className="font-medium block" htmlFor="signout">
                                    Sign Out of the device
                                </label>
                                <span className="text-sm">Sign out of the device with active session</span>
                            </div>
                            <Button className="w-20" variant="default" type="button" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </form>
                        <span className="w-full h-px block bg-white/40" />
                        <span className="mt-4 block text-center text-white/40">
                            Built with{" "}
                            <Link
                                className="text-white underline underline-offset-2"
                                href="https://aura-stack-auth.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @aura-stack/auth
                            </Link>
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
                                    <Button
                                        type="button"
                                        className="w-full rounded-none"
                                        variant="outline"
                                        disabled={isPending}
                                        key={provider}
                                        onClick={() => signIn(provider.toLowerCase())}
                                    >
                                        Sign In with {provider}
                                    </Button>
                                ))}
                            </div>
                            <p className="my-5 relative">
                                <span className="w-full h-px block absolute top-1/2 bg-white/40" />
                                <span className="px-2 relative z-10 bg-black">Or continue with</span>
                            </p>
                            <form className="w-full text-start" onSubmit={handleSignInCredentials}>
                                <div>
                                    <label className="font-medium block" htmlFor="username">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        aria-label="Username"
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
                                        aria-label="Password"
                                        className="w-full h-9 mt-1 font-medium border border-input rounded-none bg-background hover:text-accent-foreground hover:bg-input/50 focus:outline-1"
                                    />
                                </div>
                                <Button className="w-full mt-6" variant="default">
                                    Sign In
                                </Button>
                            </form>
                        </div>
                        <span className="w-full h-px block bg-white/40" />
                        <span className="block text-center text-white/40">
                            Built with{" "}
                            <Link
                                className="text-white underline underline-offset-2"
                                href="https://aura-stack-auth.vercel.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @aura-stack/auth
                            </Link>
                        </span>
                    </div>
                )}
            </section>
        </main>
    )
}
