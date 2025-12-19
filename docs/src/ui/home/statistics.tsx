import Link from "next/link"
import { Download, Github, Users } from "lucide-react"
import { SectionHeader } from "@/ui/home/section-header"

const statistics = [
    {
        icon: Github,
        value: "1+",
        label: "Stars on GitHub",
        link: "https://github.com/aura-stack-ts/auth",
    },
    {
        icon: Users,
        value: "1+",
        label: "Discord Members",
        link: "https://discord.gg/anXExMR5",
    },
    {
        icon: Download,
        value: "400+",
        label: "Downloads",
        link: "https://npmjs.com/package/@aura-stack/auth",
    },
]

export const Statistics = () => {
    return (
        <section>
            <SectionHeader
                title="Statistics"
                description="Discover the innovative features that position Aura Auth as the top choice for contemporary authentication solutions."
            />
            <div className="grid md:grid-cols-3 gap-6">
                {statistics.map((stat) => (
                    <Link
                        key={stat.label}
                        className="px-6 py-12 flex flex-col items-center justify-center gap-3 text-center border-b border-border last:border-b-0 md:border-r md:border-b-0 md:last:border-r-0"
                        href={stat.link}
                        target="_blank"
                    >
                        <div className="flex items-center">
                            <stat.icon className="size-6 text-neutral-500" />
                            <span className="text-4xl font-semibold text-white tracking-tight">{stat.value}</span>
                        </div>
                        <p className="text-xs text-neutral-500">{stat.label}</p>
                    </Link>
                ))}
            </div>
        </section>
    )
}
