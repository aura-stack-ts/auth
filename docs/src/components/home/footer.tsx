import Link from "next/link"

const documentation = [
    { title: "Overview", href: "/docs" },
    { title: "Quick Start", href: "/docs/quick-start" },
    { title: "OAuth Providers", href: "/docs/oauth" },
]

const community = [
    { title: "Contributing", href: "/docs/contributing" },
    { title: "GitHub", href: "https://github.com/aura-stack-ts/auth" },
    { title: "Discord", href: "https://discord.gg/eY8xMS6Brx" },
]

const resources = [
    { title: "Npm Package", href: "https://www.npmjs.com/package/@aura-stack/auth" },
    { title: "API Reference", href: "/docs/api-reference/core" },
    { title: "Issues", href: "https://github.com/aura-stack-ts/auth/issues" },
]

export const Footer = () => {
    const year = new Date().getFullYear()

    return (
        <footer className="px-6 border-t border-border">
            <div className="max-w-6xl mx-auto">
                <div className="py-10 grid gap-8 border-b border-border sm:py-8 sm:gap-x-12 md:py-10 md:grid-cols-[1.5fr_auto_auto_auto] md:gap-x-14 base:py-16 base:gap-x-20 lg:py-24">
                    <div>
                        <h3 className="font-semibold text-primary mb-4">Aura Auth</h3>
                        <p className="text-sm text-primary-foreground">Modern authentication for TypeScript applications.</p>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Documentation</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            {documentation.map(({ title, href }) => (
                                <li key={href}>
                                    <Link href={href} className="hover:text-primary transition">
                                        {title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Community</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            {community.map(({ title, href }) => (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        className="hover:text-primary transition"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        {title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-primary mb-4">Resources</h4>
                        <ul className="space-y-2 text-sm text-primary-foreground">
                            {resources.map(({ title, href }) => (
                                <li key={href}>
                                    <Link href={href} className="hover:text-primary transition">
                                        {title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="py-4 flex flex-col md:flex-row items-center justify-between">
                    <p className="text-sm text-neutral-500">© {year} Aura Stack. All rights reserved.</p>
                    <div className="flex items-center gap-6 text-sm text-neutral-500 mt-6 md:mt-0">
                        <Link
                            className="hover:text-neutral-300 transition"
                            href="https://github.com/aura-stack-ts/auth"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            GitHub
                        </Link>
                        <Link
                            className="hover:text-neutral-300 transition"
                            href="https://www.npmjs.com/package/@aura-stack/auth"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            npm
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
