import { createFileRoute } from "@tanstack/react-router"
import HeroComponent from "@/components/hero"

export const Route = createFileRoute("/")({
    component: IndexPage,
    loader: async () => {},
})

export function IndexPage() {
    return (
        <div className="w-full min-h-screen bg-black text-foreground flex flex-col font-sans antialiased">
            <HeroComponent />
        </div>
    )
}
