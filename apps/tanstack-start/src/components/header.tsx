import { useState } from "react"
import { Button } from "./ui/button"
import { Menu, X } from "lucide-react"

export const Header = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <header className="fixed top-0 w-full z-50 border-b border-gray-800/50 bg-black/80 backdrop-blur-md">
            <nav className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="text-xl font-semibold text-white">Aura Auth</div>

                    <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <a href="#getting-started" className="text-sm text-white/60 hover:text-white transition-colors">
                            Documentation
                        </a>
                        <a href="#components" className="text-sm text-white/60 hover:text-white transition-colors">
                            Repository
                        </a>
                        <a href="#documentation" className="text-sm text-white/60 hover:text-white transition-colors">
                            Discord
                        </a>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Button type="button" variant="default" size="sm">
                            Sign In
                        </Button>
                    </div>

                    <button
                        type="button"
                        className="md:hidden text-white"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
                    <div className="px-6 py-4 flex flex-col gap-4">
                        <a
                            href="#getting-started"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Getting started
                        </a>
                        <a
                            href="#components"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Components
                        </a>
                        <a
                            href="#documentation"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Documentation
                        </a>
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                            <Button type="button" variant="ghost" size="sm">
                                Sign in
                            </Button>
                            <Button type="button" variant="default" size="sm">
                                Sign Up
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

Header.displayName = "Header"
