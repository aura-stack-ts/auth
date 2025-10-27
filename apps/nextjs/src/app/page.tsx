import Image from "next/image"

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <Image className="dark:invert" src="/next.svg" alt="Next.js logo" width={100} height={20} priority />
                <form action="/auth/signIn/github" method="GET">
                    <button className="border border-solid border-gray-400 h-10">SignIn with Github</button>
                </form>
            </main>
        </div>
    )
}
