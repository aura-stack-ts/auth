import { useState } from "react"
import { Link, useRouter } from "@tanstack/react-router"
import { Button } from "./ui/button"
import { signOut } from "@/lib/auth"
import { Menu, X } from "lucide-react"
import { useSession } from "@/contexts/auth"

export const Header = () => {
    const { isAuthenticated, isLoading } = useSession()
    const router = useRouter()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    const handleSignOut = async () => {
        await signOut()
        router.navigate({ to: "/" })
    }

    return (
        <header className="fixed top-0 w-full z-50 border-b border-muted bg-black/80 backdrop-blur-md">
            <nav className="w-11/12 max-w-5xl mx-auto py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-xl font-semibold text-white">
                        Aura Auth
                    </Link>
                    <div className="hidden md:flex items-center justify-center gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                        <a
                            href="https://aura-stack-auth.vercel.app/docs"
                            className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Documentation
                        </a>
                        <a
                            href="https://github.com/aura-stack-ts/auth"
                            className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Repository
                        </a>
                        <a
                            href="https://discord.com/invite/anXExMR5"
                            className="text-sm text-white/60 hover:text-white transition-colors"
                        >
                            Discord
                        </a>
                    </div>
                    {!isLoading && !isAuthenticated && (
                        <Button variant="outline" size="sm" asChild>
                            <Link to="/signIn">Sign In</Link>
                        </Button>
                    )}
                    {isAuthenticated && (
                        <div className="hidden md:flex items-center gap-x-2">
                            <Button variant="outline" size="sm" onClick={handleSignOut}>
                                Sign Out
                            </Button>
                            <Button size="sm" asChild>
                                <Link to="/users/profile">Profile</Link>
                            </Button>
                        </div>
                    )}
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
                        <Link
                            to="/signIn"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Getting started
                        </Link>
                        <a
                            href="https://github.com/aura-stack-ts/auth"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Repository
                        </a>
                        <a
                            href="https://discord.com/invite/anXExMR5"
                            className="text-sm text-white/60 hover:text-white transition-colors py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Discord
                        </a>
                        <div className="flex flex-col gap-2 pt-4 border-t border-gray-800/50">
                            {!isLoading && !isAuthenticated && (
                                <Button type="button" variant="ghost" size="sm" asChild>
                                    <Link to="/signIn">Sign in</Link>
                                </Button>
                            )}
                            {isAuthenticated && (
                                <div className="flex flex-col items-center gap-y-3 md:hidden">
                                    <Button className="w-full" variant="outline" size="sm" onClick={handleSignOut}>
                                        Sign Out
                                    </Button>
                                    <Button className="w-full" size="sm" asChild>
                                        <Link to="/users/profile">Profile</Link>
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
