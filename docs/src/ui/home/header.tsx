import Link from "next/link"

export const Header = () => {
    return (
        <header className="sticky top-0 z-50">
            <nav className="border-b border-border bg-black/80 backdrop-blur-xl">
                <div className="mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 font-mono text-sm">
                        <span className="text-neutral-400">&gt;_</span>
                        <span className="text-white font-medium">Aura Auth</span>
                    </div>
                    <Link
                        href="/docs"
                        className="px-4 py-2 text-sm font-medium text-white border border-border rounded-lg transition-all duration-200"
                    >
                        Get Started
                    </Link>
                </div>
            </nav>
        </header>
    )
}
