"use client"

import Link from "next/link"
import Image from "next/image"
import { EditProfile } from "@/components/edit-profile"
import { Button } from "@/components/ui/button"
import { useAuthActions, useSession } from "@aura-stack/next/client"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FieldDescription } from "@/components/ui/field"

export const Profile = () => {
    const { session, status } = useSession()
    const { updateSession, signOut } = useAuthActions()

    const handleUpdateSession = async (formData: FormData) => {
        await updateSession({
            session: {
                user: {
                    name: formData.get("username") ? (formData.get("username") as string) : undefined,
                    email: formData.get("email") ? (formData.get("email") as string) : undefined,
                },
            },
        })
    }

    const handleSignOut = async () => {
        await signOut()
    }

    return (
        <Card className="w-full max-w-lg px-6 py-8 sm:py-12 relative gap-6">
            {status === "authenticated" ? (
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
                    <Separator />
                    <EditProfile action={handleUpdateSession} />
                    <Separator />
                    <form className="flex items-center justify-between gap-x-4">
                        <div>
                            <label className="font-medium block" htmlFor="signout">
                                Sign Out of the device
                            </label>
                            <span className="text-sm">Sign out of the device with active session</span>
                        </div>
                        <Button variant="default" type="button" onClick={handleSignOut}>
                            Sign Out
                        </Button>
                    </form>
                </>
            ) : (
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white">There's no active session.</h2>
                    <p className="mt-3 text-sm text-white/40">
                        In the App Router, client-side rendering relies on the useSession hook, which runs on every request, so we
                        use it to retrieve the current session.
                    </p>
                </div>
            )}
            <Separator />
            <FieldDescription className="mx-auto max-w-sm text-center text-sm leading-snug">
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
    )
}

export default Profile
