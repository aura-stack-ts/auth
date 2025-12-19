import Link from "next/link"

export const Footer = () => {
    return (
        <footer className="border-t border-border">
            <div className="max-w-6xl mx-auto px-3 sm:px-5 md:px-8 base:px-12">
                <div className="py-6 grid gap-8 border-b border-border sm:py-8 md:py-10 md:grid-cols-4 base:py-14">
                    <div>
                        <h3 className="font-semibold text-white mb-4">Aura Auth</h3>
                        <p className="text-sm text-neutral-400">Modern authentication for TypeScript applications.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-4">Documentation</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li>
                                <Link href="/docs" className="hover:text-white transition">
                                    Overview
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/quick-start" className="hover:text-white transition">
                                    Quick Start
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/oauth" className="hover:text-white transition">
                                    OAuth Providers
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-4">Community</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li>
                                <Link href="/docs/contributing" className="hover:text-white transition">
                                    Contributing
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/aura-stack-ts/auth" className="hover:text-white transition">
                                    GitHub
                                </Link>
                            </li>
                            <li>
                                <Link href="https://x.com/aura_stack" className="hover:text-white transition">
                                    X (Twitter)
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-white mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-neutral-400">
                            <li>
                                <Link
                                    href="https://www.npmjs.com/package/@aura-stack/auth"
                                    className="hover:text-white transition"
                                >
                                    npm Package
                                </Link>
                            </li>
                            <li>
                                <Link href="/docs/contributing" className="hover:text-white transition">
                                    API Reference
                                </Link>
                            </li>
                            <li>
                                <Link href="https://github.com/aura-stack-ts/auth/issues" className="hover:text-white transition">
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
                        <Link href="https://x.com/aura_stack" className="hover:text-neutral-300 transition">
                            X
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
