import Link from "next/link"
import { Github } from "lucide-react"
import { Ripple } from "@/ui/ripple"

export const ContributeOpenSource = () => {
    return (
        <section className="h-[500px] w-full relative flex flex-col items-center justify-center overflow-hidden">
            <Ripple />
            <div className="px-6 text-center text-5xl font-medium tracking-tighter whitespace-pre-wrap text-white relative z-10">
                <h3 className="font-medium uppercase tracking-wider ">Join Our Community</h3>
                <p className="mt-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Help us build the future of authentication. Contribute code, report issues, or share your ideas with our
                    growing community of developers.
                </p>
                <Link
                    href="https://github.com/aura-stack-ts/auth"
                    className="mt-5  px-5 py-2.5 inline-flex items-center gap-2 text-sm font-medium text-white tracking-normal bg-neutral-900 hover:bg-neutral-800 rounded-lg border border-border transition-all duration-200"
                >
                    <Github className="h-4 w-4" />
                    Become a Contributor
                </Link>
            </div>
        </section>
    )
}
