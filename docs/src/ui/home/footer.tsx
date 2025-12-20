import Link from "next/link"

export const Footer = () => {
    return (
        <footer className="border-t border-border">
            <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-8 base:px-12">
                <div className="py-10 grid gap-8 border-b border-border sm:py-8 sm:gap-x-12 md:py-10 md:grid-cols-[1.5fr_auto_auto_auto] md:gap-x-14 base:py-16 base:gap-x-20 lg:py-24">
                    <div>
                        <h3 className="font-semibold text-primary mb-4">Aura Auth</h3>
                        <p className="text-sm text-primary-foreground">Modern authentication for TypeScript applications.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Documentation</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            <li>
                                <Link href="/docs" className="hover:text-primary transition">
                                    Overview
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/quick-start" className="hover:text-primary transition">
                                    Quick Start
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/oauth" className="hover:text-primary transition">
                                    OAuth Providers
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Community</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            <li>
                                <Link href="/docs/contributing" className="hover:text-primary transition">
                                    Contributing
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/aura-stack-ts/auth" className="hover:text-primary transition">
                                    GitHub
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            <li>
                                <Link
                                    href="https://www.npmjs.com/package/@aura-stack/auth"
                                    className="hover:text-primary transition"
                                >
                                    npm Package
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/contributing" className="hover:text-primary transition">
                                    API Reference
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="https://github.com/aura-stack-ts/auth/issues"
                                    className="hover:text-primary transition"
                                >
                                    Issues
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="py-4 flex flex-col md:flex-row items-center justify-between">
                    <p className="text-sm text-neutral-500">© 2025 Aura Stack. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-sm text-neutral-500 mt-6 md:mt-0">
                        <Link href="https://github.com/aura-stack-ts/auth" className="hover:text-neutral-300 transition">
                            GitHub
                        </Link>
                        <Link href="https://www.npmjs.com/package/@aura-stack/auth" className="hover:text-neutral-300 transition">
                            npm
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
