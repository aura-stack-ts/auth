import { createFileRoute } from "@tanstack/react-router"
import { Features } from "@/components/features"
import { Hero } from "@/components/hero"

export const Route = createFileRoute("/")({
    component: IndexPage,
    loader: async () => {},
})

export function IndexPage() {
    return (
        <div className="w-full min-h-screen pt-22 text-white flex flex-col font-sans antialiased bg-black">
            <Hero />
            <Features />
        </div>
    )
}
