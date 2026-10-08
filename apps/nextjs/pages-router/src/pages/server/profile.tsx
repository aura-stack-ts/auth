import Link from "next/link"
import { api } from "@/lib/auth"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FieldDescription } from "@/components/ui/field"
import type { IncomingMessage } from "http"
import type { InferGetServerSidePropsType } from "next"
import Image from "next/image"

export const getServerSideProps = async ({ req }: { req: IncomingMessage }) => {
    const session = await api.getSession({
        headers: req.headers as Record<string, string>,
    })

    return {
        props: {
            session: session.success ? session.session : null,
        },
    }
}

export const Profile = ({ session }: InferGetServerSidePropsType<typeof getServerSideProps>) => {
    const isAuthenticated = !!session
    return (
        <section className="main-container">
            <Card className="w-full max-w-lg px-6 py-8 sm:p-12 relative gap-6">
                {isAuthenticated ? (
                    <>
                        {session?.user?.image ? (
                            <Image
                                className="rounded-full"
                                src={session.user?.image}
                                alt={`User image ${session.user?.name}`}
                                width={56}
                                height={56}
                            />
                        ) : (
                            <span className="size-14 block rounded-full ring-2 ring-ring">
                                <span className="h-full w-full p-0.5 aspect-square text-xl font-bold flex items-center justify-center rounded-full">
                                    {session?.user?.name?.[0] || "?"}
                                </span>
                            </span>
                        )}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-lg font-medium text-white">{session?.user?.name}</p>
                                <p className="text-xs text-white/40 font-mono">{session?.user?.email}</p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold text-white">There's no active session.</h2>
                        <p className="mt-3 text-sm text-white/40">
                            In the App Router, client-side rendering relies on the useSession hook, which runs on every request,
                            so we use it to retrieve the current session.
                        </p>
                    </div>
                )}
                <Separator />
                <FieldDescription className="max-w-sm text-center text-sm leading-snug">
                    Built with{" "}
                    <Link
                        className="text-white underline underline-offset-2"
                        href="https://aura-stack-auth.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Aura Auth
                    </Link>
                </FieldDescription>
            </Card>
        </section>
    )
}

export default Profile
