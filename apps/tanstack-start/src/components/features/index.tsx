import { CardContent, CardHeader } from "@/components/ui/card"
import { Calendar, LucideIcon, MapIcon } from "lucide-react"
import { FeatureCard } from "./card"

export function Features() {
    return (
        <section className="bg-zinc-50 py-16 md:py-32 dark:bg-transparent">
            <div className="mx-auto max-w-2xl px-6 lg:max-w-5xl">
                <div className="mx-auto grid gap-4 lg:grid-cols-2">
                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading icon={MapIcon} title="Secure & Robust" description="Server functions you can trust." />
                        </CardHeader>
                        <CardContent className="relative mb-6 border-t border-dashed sm:mb-0">
                            Authenticate users directly in loaders and server functions. Aura Auth handles the heavy lifting of
                            session validation and authorization checks securely on the server.
                        </CardContent>
                    </FeatureCard>
                    <FeatureCard>
                        <CardHeader className="pb-3">
                            <CardHeading icon={Calendar} title="Reactive & Fast" description="Hooks for modern interfaces." />
                        </CardHeader>
                        <CardContent className="relative mb-6 border-t border-dashed sm:mb-0">
                            Build dynamic UIs with React hooks that give you instant access to user session state, sign-in
                            methods, and sign-out functionality without prop drilling.
                        </CardContent>
                    </FeatureCard>
                    <FeatureCard className="p-6 lg:col-span-2">
                        <p className="mx-auto my-6 max-w-md text-balance text-center text-2xl font-semibold">
                            Always in sync, everywhere.
                        </p>
                        <CardContent className="relative mb-6 border-t border-dashed sm:mb-0">
                            Never worry about hydration mismatches again. Aura Auth keeps your server session and client state
                            perfectly synchronized automatically.
                        </CardContent>
                    </FeatureCard>
                </div>
            </div>
        </section>
    )
}

interface CardHeadingProps {
    icon: LucideIcon
    title: string
    description: string
}

const CardHeading = ({ icon: Icon, title, description }: CardHeadingProps) => (
    <div className="p-6">
        <span className="text-muted-foreground flex items-center gap-2">
            <Icon className="size-4" />
            {title}
        </span>
        <p className="mt-8 text-2xl font-semibold">{description}</p>
    </div>
)
