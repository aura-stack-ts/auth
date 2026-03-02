"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const menuItems = [
    { name: "Home", href: "/" },
    { name: "Docs", href: "/docs" },
    { name: "Community", href: "/docs/contributing" },
]

export const Header = () => {
    const [menuState, setMenuState] = useState(false)

    return (
        <header>
            <nav data-state={menuState && "active"} className="group w-full px-6 fixed z-20 border-b border-border bg-background">
                <div className="mx-auto max-w-6xl text-muted-foreground transition-all duration-300">
                    <div className="py-3 flex flex-wrap items-center justify-between gap-6 relative lg:gap-0 lg:py-4">
                        <div className="w-full flex items-center justify-between lg:w-auto">
                            <Link className="text-white" href="/" aria-label="home">
                                Aura Auth
                            </Link>
                            <Button
                                onClick={() => setMenuState(!menuState)}
                                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                                variant="ghost"
                                size="icon-lg"
                                className="-mr-2 text-white relative z-20 cursor-pointer lg:hidden"
                            >
                                <Menu className="in-data-[state=active]:rotate-180 group-data-[state=active]:scale-0 group-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                                <X className="group-data-[state=active]:rotate-0 group-data-[state=active]:scale-100 group-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
                            </Button>
                        </div>
                        <div className="m-auto absolute inset-0 hidden size-fit lg:block">
                            <ul className="flex gap-8 text-base">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link href={item.href} className="hover:text-white block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="w-full mt-5 hidden flex-wrap items-center justify-end space-y-8 bg-background group-data-[state=active]:block lg:group-data-[state=active]:flex md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 dark:lg:bg-transparent">
                            <ul className="space-y-4 text-base lg:hidden">
                                {menuItems.map((item, index) => (
                                    <li key={index}>
                                        <Link href={item.href} className="hover:text-white block duration-150">
                                            <span>{item.name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex w-full items-center flex-col space-y-3 sm:hidden sm:gap-3 sm:space-y-0 md:w-fit lg:flex lg:flex-row">
                                <Button
                                    className="w-full text-white border-white/10 rounded-none bg-white/10 lg:w-fit lg:hidden"
                                    size="lg"
                                    asChild
                                >
                                    <Link href="https://github.com/aura-stack-ts/auth" target="_blank" rel="noopener noreferrer">
                                        GitHub
                                    </Link>
                                </Button>
                                <Button className="hidden lg:flex" variant="ghost" asChild>
                                    <Link href="https://github.com/aura-stack-ts/auth" target="_blank" rel="noopener noreferrer">
                                        GitHub
                                    </Link>
                                </Button>
                                <Button className="w-full rounded-none lg:w-fit" variant="outline" size="lg" asChild>
                                    <Link href="/docs">Get Started</Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
