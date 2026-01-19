import { GithubIcon } from "lucide-react"

export function MinimalFooter() {
    const year = new Date().getFullYear()

    const community = [
        {
            title: "Discord Support",
            href: "https://discord.com/invite/anXExMR5",
        },
    ]

    const resources = [
        {
            title: "Documentation",
            href: "https://aura-stack-auth.vercel.app/docs",
        },
        {
            title: "GitHub Repository",
            href: "https://github.com/aura-stack-ts/auth",
        },
        {
            title: "NPM Registry",
            href: "https://npmjs.com/package/@aura-stack/auth",
        },
    ]

    const socialLinks = [
        {
            icon: <GithubIcon className="size-4" />,
            link: "https://github.com/aura-stack-ts/auth",
        },
    ]
    return (
        <footer className="relative">
            <div className="bg-[radial-gradient(35%_80%_at_30%_0%,--theme(--color-foreground/.1),transparent)] mx-auto max-w-4xl md:border-x">
                <div className="bg-border absolute inset-x-0 h-px w-full" />
                <div className="grid max-w-4xl grid-cols-6 gap-6 p-4">
                    <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
                        <a href="" className="w-max opacity-25">
                            Aura Auth
                        </a>
                        <p className="text-muted-foreground max-w-sm font-mono text-sm text-balance">
                            Built for speed, security, and developer experience. The complete authentication library for
                            TypeScript applications.
                        </p>
                        <div className="flex gap-2">
                            {socialLinks.map((item, i) => (
                                <a key={i} className="hover:bg-accent rounded-md border p-1.5" target="_blank" href={item.link}>
                                    {item.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 w-full md:col-span-1">
                        <span className="text-muted-foreground mb-1 text-xs">Resources</span>
                        <div className="flex flex-col gap-1">
                            {resources.map(({ href, title }, i) => (
                                <a key={i} className={`w-max py-1 text-sm duration-200 hover:underline`} href={href}>
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 w-full md:col-span-1">
                        <span className="text-muted-foreground mb-1 text-xs">Community</span>
                        <div className="flex flex-col gap-1">
                            {community.map(({ href, title }, i) => (
                                <a key={i} className={`w-max py-1 text-sm duration-200 hover:underline`} href={href}>
                                    {title}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-border absolute inset-x-0 h-px w-full" />
                <div className="flex max-w-4xl flex-col justify-between gap-2 pt-2 pb-5">
                    <p className="text-muted-foreground text-center font-thin">
                        © <a href="https://github.com/aura-stack-ts">Aura Stack Labs</a>. All rights reserved {year}
                    </p>
                </div>
            </div>
        </footer>
    )
}
export const Footer = () => {
    const year = new Date().getFullYear()

    const community = [
        {
            title: "Discord Support",
            href: "https://discord.com/invite/anXExMR5",
        },
    ]

    const resources = [
        {
            title: "Documentation",
            href: "https://aura-stack-auth.vercel.app/docs",
        },
        {
            title: "GitHub Repository",
            href: "https://github.com/aura-stack-ts/auth",
        },
        {
            title: "NPM Registry",
            href: "https://npmjs.com/package/@aura-stack/auth",
        },
    ]

    const socialLinks = [
        {
            icon: <GithubIcon className="size-4" />,
            link: "https://github.com/aura-stack-ts/auth",
        },
    ]
    return (
        <footer className="relative border-t bg-black">
            <div className="w-11/12 mx-auto max-w-5xl md:border-x">
                <div className="py-10 px-6 max-w-5xl grid grid-cols-6 gap-6">
                    <div className="col-span-6 flex flex-col gap-5 md:col-span-4">
                        <a href="" className="w-max opacity-25">
                            Aura Auth
                        </a>
                        <p className="max-w-sm text-muted-foreground font-mono text-sm text-balance">
                            Built for speed, security, and developer experience. The complete authentication library for
                            TypeScript applications.
                        </p>
                        <div className="flex gap-2">
                            {socialLinks.map((item, i) => (
                                <a key={i} className="p-1.5 border rounded-md hover:bg-accent" target="_blank" href={item.link}>
                                    {item.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                    <div className="col-span-3 w-full base:col-span-1">
                        <span className="mb-1 text-sm">Resources</span>
                        <ul className="flex flex-col gap-1">
                            {resources.map(({ href, title }, i) => (
                                <a
                                    key={i}
                                    className={`w-max py-1 text-xs text-muted-foreground duration-200 hover:underline`}
                                    href={href}
                                >
                                    {title}
                                </a>
                            ))}
                        </ul>
                    </div>
                    <div className="col-span-3 w-full base:col-span-1">
                        <span className="mb-1 text-sm">Community</span>
                        <ul className="flex flex-col gap-1">
                            {community.map(({ href, title }, i) => (
                                <a
                                    key={i}
                                    className={`w-max py-1 text-xs text-muted-foreground duration-200 hover:underline`}
                                    href={href}
                                >
                                    {title}
                                </a>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className="w-full h-px absolute inset-x-0 bg-border" />
                <div className="max-w-5xl py-4 flex flex-col justify-between gap-2">
                    <p className="text-sm text-muted-foreground text-center font-thin">
                        © <a href="https://github.com/aura-stack-ts">Aura Stack Labs</a>. All rights reserved {year}
                    </p>
                </div>
            </div>
        </footer>
    )
}

Footer.displayName = "Footer"
