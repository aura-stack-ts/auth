import Link from "next/link"
import Image from "next/image"
import type { IncomingMessage } from "http"
import { api } from "@/lib/auth"
import { InferGetServerSidePropsType } from "next"

export const getServerSideProps = async ({ req }: { req: IncomingMessage }) => {
    const session = await api.getSession({
        headers: req.headers as Record<string, string>,
    })

    return {
        props: {
            session: session.session,
        },
    }
}

export default function AuthServerPage({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) {
    const isAuthenticated = !!session?.user

    return (
        <main className="w-11/12 min-h-container max-w-5xl mx-auto content-center">
            <section className="max-w-lg mx-auto space-y-8">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white">Aura Auth + Next.js Server Components</h1>
                    <p className="mt-2 text-base text-white/70 max-w-3xl">
                        Official Next.js demo to showcase @aura-stack/react authentication library with getServerSideProps Server
                        Side Rendering (SSR), for Client-Side Rendering (CSR) visit{" "}
                        <Link className="text-white underline underline-offset-2" href="/client">
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
                        <span className="my-4 w-full h-px block bg-white/40" />
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
                ) : (
                    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-white">There's no active session.</h2>
                            <p className="mt-3 mb-6 text-sm text-white/40">
                                In the Pages Router, server-side rendering relies on the getServerSideProps function, which runs
                                on every request, so we use it to retrieve the current session.
                            </p>
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
