import Link from "next/link"
import { Github } from "lucide-react"

export const ContributeOpenSource = () => {
    return (
        <section>
            <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="px-6 py-16">
                    <h3 className="font-medium uppercase tracking-wider ">Join Our Community</h3>
                    <p className="mt-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Help us build the future of authentication. Contribute code, report issues, or share your ideas with our
                        growing community of developers.
                    </p>
                    <Link
                        href="https://github.com/aura-stack-ts/auth"
                        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-border transition-all duration-200"
                    >
                        <Github className="h-4 w-4" />
                        Become a contributor
                    </Link>
                </div>
                <div className="flex items-center justify-center">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div
                            key={i}
                            className="h-14 w-14 rounded-full bg-neutral-900 border border-border flex items-center justify-center text-neutral-400 font-medium text-lg nth-[2]:-ml-4 nth-[3]:-ml-4 nth-[4]:-ml-4"
                        >
                            {["A", "U", "R", "A"][i]}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
