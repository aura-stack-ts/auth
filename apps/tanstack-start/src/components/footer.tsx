export const Footer = () => {
    return (
        <footer className="border-t bg-black">
            <div className="container mx-auto px-4 sm:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 font-bold text-lg">Aura Auth</div>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                            Built for speed, security, and developer experience. The complete authentication library for
                            TypeScript applications.
                        </p>
                        <p className="text-sm text-muted-foreground pt-4">© 2025 Aura Auth Labs. All rights reserved.</p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 text-foreground">Resources</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="https://aura-stack-auth.vercel.app/docs"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    Documentation
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/aura-stack-ts/auth"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    GitHub Repository
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://npmjs.com/package/@aura-stack/auth"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    NPM Registry
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-4 text-foreground">Community</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <a
                                    href="https://discord.com/invite/anXExMR5"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="hover:text-primary transition-colors hover:underline"
                                >
                                    Discord Support
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    )
}

Footer.displayName = "Footer"
