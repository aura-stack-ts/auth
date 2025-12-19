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
        icon: ({ className }: { className?: string }) => (
            <svg className={className} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.369a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.445.865-.608 1.25a18.27 18.27 0 0 0-5.487 0c-.163-.39-.398-.875-.609-1.25a.077.077 0 0 0-.079-.036 19.736 19.736 0 0 0-4.884 1.515.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 6.01 3.03.08.08 0 0 0 .087-.027c.461-.63.87-1.295 1.218-1.994a.072.072 0 0 0-.04-.1 13.07 13.07 0 0 1-1.853-.88.073.073 0 0 1-.007-.121c.124-.093.248-.19.368-.29a.071.071 0 0 1 .074-.01c3.89 1.775 8.104 1.775 11.967 0a.071.071 0 0 1 .075.01c.12.1.244.197.369.29a.073.073 0 0 1-.006.121c-.59.36-1.203.666-1.853.88a.072.072 0 0 0-.04.1c.348.699.757 1.364 1.218 1.994a.082.082 0 0 0 .087.027 19.857 19.857 0 0 0 6.01-3.03.081.081 0 0 0 .032-.056c.44-4.467-.732-8.952-3.102-12.684a.062.062 0 0 0-.031-.028zM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.973-2.419 2.157-2.419 1.184 0 2.158 1.086 2.157 2.419 0 1.334-.973 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.973-2.419 2.157-2.419 1.184 0 2.158 1.086 2.157 2.419 0 1.334-.973 2.419-2.157 2.419z" />
            </svg>
        ),
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
                        <span className="text-8xl font-semibold text-transparent tracking-tight bg-clip-text bg-linear-to-r from-purple-600 to-blue-400">
                            {stat.value}
                        </span>
                        <div className="flex items-center gap-x-2 text-primary">
                            <stat.icon className="size-6" />
                            <p className="text-base">{stat.label}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
