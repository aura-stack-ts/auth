import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useAuth } from "@aura-stack/react"
import { Button } from "@/components/ui/button"

export const Header = () => {
    const { status, isPending, signOut, signIn } = useAuth()
    const isAuthenticated = status === "authenticated"
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
    }

    const handleSignIn = async () => {
        await signIn("github")
    }

    return (
        <header className="fixed top-0 w-full z-50 border-b border-muted bg-black/80 backdrop-blur-md">
            <nav className="w-11/12 max-w-6xl mx-auto py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-white">
                        Aura Auth
                    </Link>
                    <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground">
                        <a
                            href="https://aura-stack-auth.vercel.app/docs"
                            className="text-sm hover:text-white transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Documentation
                        </a>
                        <a
                            href="https://github.com/aura-stack-ts/auth"
                            className="text-sm hover:text-white transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Repository
                        </a>
                        <a
                            href="https://discord.com/invite/anXExMR5"
                            className="text-sm hover:text-white transition-colors"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Discord
                        </a>
                    </div>
                    {!isAuthenticated && (
                        <a
                            href="https://tanstack.com/start"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hidden text-xl font-semibold text-white md:flex"
                        >
                            TanStack Start
                        </a>
                    )}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center gap-x-2">
                            <Button variant="outline" size="sm" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                        </div>
                    )}
                    <Button
                        type="button"
                        className="md:hidden text-white"
                        variant="outline"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </Button>
                </div>
            </nav>

            {mobileMenuOpen && (
                <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-gray-800/50 animate-[slideDown_0.3s_ease-out]">
                    <div className="px-6 py-4 flex flex-col gap-4">
                        <a
                            href="https://aura-stack-auth.vercel.app/docs"
                            className="text-sm text-muted-foreground hover:text-white transition-colors py-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Documentation
                        </a>
                        <a
                            href="https://github.com/aura-stack-ts/auth"
                            className="text-sm text-muted-foreground hover:text-white transition-colors py-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Repository
                        </a>
                        <a
                            href="https://discord.com/invite/anXExMR5"
                            className="text-sm text-muted-foreground hover:text-white transition-colors py-2"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Discord
                        </a>
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                            {!isPending && !isAuthenticated && (
                                <Button type="button" onClick={handleSignIn}>
                                    Sign in with GitHub
                                </Button>
                            )}
                            {isAuthenticated && (
                                <div className="flex flex-col items-center gap-y-3 md:hidden">
                                    <Button className="w-full" onClick={handleSignOut}>
                                        Sign Out
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    )
}

Header.displayName = "Header"
