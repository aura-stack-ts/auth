import { signOut, getSession } from "../lib/server"
import { providers } from "@/lib/providers"
import { Hero } from "@/components/hero"

export default async function Home() {
    const session = await getSession()

    return <Hero />
}
