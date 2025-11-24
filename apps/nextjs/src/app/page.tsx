import { headers } from "next/headers"
import Image from "next/image"

const getSession = async () => {
    const headersList = new Headers(await headers())
    const session = await fetch("http://localhost:3000/auth/session", {
        headers: headersList,
    })
    const response = await session.json()
    return response
}

const signOut = async () => {
    "use server"
    const headersList = new Headers(await headers())
    headersList.set("Content-Type", "application/json")
    headersList.delete("Content-Length")
    console.log("headersList", headersList)
    const signOutResponse = await fetch("http://localhost:3000/auth/signOut?token_type_hint=session_token", {
        method: "POST",
        headers: headersList,
        body: JSON.stringify({ csrfToken: headersList.get("csrfToken") }),
    })
    console.log("signOutResponse", signOutResponse)
    const response = await signOutResponse.json()
    return response
}

export default async function Home() {
    const session = await getSession()

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
                <span>
                    <pre>{JSON.stringify(session, null, 2)}</pre>
                </span>
                <form action="/auth/signOut?token_type_hint=session_token" method="POST">
                    <button className="border border-solid border-gray-400 h-10">SignOut without CSRF Token</button>
                </form>
                <form action={signOut}>
                    <button className="border border-solid border-gray-400 h-10">SignOut With security</button>
                </form>
                <form action="/auth/signIn/github" method="GET">
                    <button className="border border-solid border-gray-400 h-10">SignIn with Github</button>
                </form>
            </main>
        </div>
    )
}
