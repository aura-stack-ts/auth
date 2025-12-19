import Link from "next/link"
import { Github } from "lucide-react"

export const Header = () => {
    return (
        <header className="sticky top-0 z-50">
            <nav className="border-b border-border bg-black/80 backdrop-blur-xl">
                <div className="mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-mono text-sm">
                        <span className="text-lg text-primary font-semibold">Aura Auth</span>
                    </div>
                    <div className="space-x-2">
                        <Link
                            href="/docs"
                            className="px-4 py-2 text-sm font-medium text-white border border-border rounded-lg transition-all duration-200 hover:bg-border"
                        >
                            Get Started
                        </Link>
                        <Link
                            href=" https://github.com/aura-stack-ts/auth"
                            target="_blank"
                            className="px-4 py-2 inline-flex items-center gap-2 text-sm font-medium text-black rounded-lg transition-all duration-200 bg-white hover:bg-neutral-100"
                        >
                            GitHub
                            <Github className="size-4" />
                        </Link>
                    </div>
                </div>
            </nav>
        </header>
    )
}
