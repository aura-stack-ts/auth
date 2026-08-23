import { Form, Link, useLoaderData } from "react-router"
import { EditProfile } from "~/components/server/edit-profile"
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { FieldDescription } from "~/components/ui/field"

export const Profile = () => {
    const { session } = useLoaderData()
    const authenticated = session?.user ? true : false

    return (
        <Card className="w-full max-w-lg px-6 py-8 sm:py-12 relative gap-6">
            {authenticated === true ? (
                <>
                    {session?.user?.image ? (
                        <img
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
                    <EditProfile />
                    <Separator />
                    <Form className="flex items-center justify-between gap-x-4" method="post">
                        <input type="hidden" name="action" value="signOut" />
                        <div>
                            <label className="font-medium block" htmlFor="signout">
                                Sign Out of the device
                            </label>
                            <span className="text-sm">Sign out of the device with active session</span>
                        </div>
                        <Button variant="default" type="submit">
                            Sign Out
                        </Button>
                    </Form>
                </>
            ) : (
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-white">There's no active session.</h2>
                    <p className="mt-3 text-sm text-white/40">
                        In the React Router, server-side rendering relies on the useSession hook, which runs on every request, so
                        we use it to retrieve the current session.
                    </p>
                    <div className="mt-6 flex items-center justify-center gap-x-4">
                        <Button className="px-8" asChild>
                            <Link to="/server/sign-in">Sign In</Link>
                        </Button>
                        <Button className="px-8" variant="secondary" asChild>
                            <Link to="/server/sign-up">Sign Up</Link>
                        </Button>
                    </div>
                </div>
            )}
            <Separator />
            <FieldDescription className="mx-auto max-w-sm text-center text-sm leading-snug">
                Built with{" "}
                <Link
                    className="text-white underline underline-offset-2"
                    to="https://aura-stack-auth.vercel.app/"
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
